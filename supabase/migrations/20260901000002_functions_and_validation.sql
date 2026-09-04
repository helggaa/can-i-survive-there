-- Supabase Migration: 20260901000002_functions_and_validation.sql
-- Validation Function (insert_area_metric) and Recompute Engine (recompute_area_metrics)

-- Function: insert_area_metric
-- Enforces all 8 validation rules per 04-bootstrap-agent-spec.md
CREATE OR REPLACE FUNCTION insert_area_metric(
    p_area_id TEXT,
    p_metric_key TEXT,
    p_value NUMERIC,
    p_currency_code TEXT,
    p_source_url TEXT,
    p_source_type TEXT DEFAULT 'aggregator',
    p_observed_at DATE DEFAULT CURRENT_DATE,
    p_agent_confidence TEXT DEFAULT 'medium',
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_city_id TEXT;
    v_country_id TEXT;
    v_expected_currency TEXT;
    v_gni_ppp NUMERIC;
    v_normalized_metric_key TEXT;
    v_metric_id TEXT;
    v_monthly_gni_ppp NUMERIC;
    v_min_bound NUMERIC;
    v_max_bound NUMERIC;
    v_recent_submission_count INT;
    v_inserted_id TEXT;
BEGIN
    -- 1. Area existence and city/country linkage
    SELECT a.city_id, c.country_id, co.currency_code, co.gni_per_capita_ppp
    INTO v_city_id, v_country_id, v_expected_currency, v_gni_ppp
    FROM areas a
    JOIN cities c ON a.city_id = c.id
    JOIN countries co ON c.country_id = co.id
    WHERE a.id = p_area_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Area ID does not exist or has no valid city/country association.');
    END IF;

    -- 2. Metric key validation (and alias resolution)
    v_normalized_metric_key := TRIM(p_metric_key);
    IF v_normalized_metric_key = 'rent_monthly' THEN
        v_normalized_metric_key := 'rent_or_kost_monthly';
    END IF;

    SELECT id INTO v_metric_id
    FROM metrics
    WHERE key = v_normalized_metric_key;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Unknown metric_key: ' || p_metric_key);
    END IF;

    -- 3. Strict positive value check
    IF p_value IS NULL OR p_value <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Value must be strictly positive (greater than 0).');
    END IF;

    -- 4. Currency code cross-check
    IF p_currency_code IS NULL OR UPPER(TRIM(p_currency_code)) <> UPPER(TRIM(v_expected_currency)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'Currency code mismatch: provided ' || COALESCE(p_currency_code, 'NULL') || ' but country expects ' || v_expected_currency
        );
    END IF;

    -- 5. Required and valid source URL
    IF p_source_url IS NULL OR TRIM(p_source_url) = '' OR 
       (p_source_url NOT LIKE 'http://%' AND p_source_url NOT LIKE 'https://%') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'source_url is required and must be a valid URL starting with http:// or https://');
    END IF;

    -- 6. Dynamic Range Sanity checks derived from country GNI PPP (05-sanity-bands-and-parallel-bootstrap.md)
    -- If country GNI PPP is available, calculate monthly baseline; otherwise use fallback band
    IF v_gni_ppp IS NOT NULL AND v_gni_ppp > 0 THEN
        v_monthly_gni_ppp := v_gni_ppp / 12.0;
    ELSE
        v_monthly_gni_ppp := 10000000.0; -- generic fallback
    END IF;

    IF v_normalized_metric_key = 'rent_or_kost_monthly' THEN
        v_min_bound := v_monthly_gni_ppp * 0.05;
        v_max_bound := v_monthly_gni_ppp * 1.50;
    ELSIF v_normalized_metric_key = 'food_meal_avg' THEN
        v_min_bound := v_monthly_gni_ppp * 0.001;
        v_max_bound := v_monthly_gni_ppp * 0.15;
    ELSIF v_normalized_metric_key = 'transport_monthly' THEN
        v_min_bound := v_monthly_gni_ppp * 0.005;
        v_max_bound := v_monthly_gni_ppp * 0.35;
    ELSIF v_normalized_metric_key = 'grocery_basket' THEN
        v_min_bound := v_monthly_gni_ppp * 0.01;
        v_max_bound := v_monthly_gni_ppp * 0.40;
    ELSE
        v_min_bound := 0.01;
        v_max_bound := 1000000000000.0;
    END IF;

    IF p_value < v_min_bound OR p_value > v_max_bound THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'Value ' || p_value || ' is out of plausible sanity range [' || ROUND(v_min_bound, 2) || ', ' || ROUND(v_max_bound, 2) || '] for ' || v_normalized_metric_key || ' in ' || v_expected_currency
        );
    END IF;

    -- 7. Rate/volume cap per area per hour
    SELECT COUNT(*) INTO v_recent_submission_count
    FROM submissions
    WHERE area_id = p_area_id AND created_at > now() - INTERVAL '1 hour';

    IF v_recent_submission_count >= 50 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Rate limit exceeded: too many inserts for this area within the last hour.');
    END IF;

    -- 8. Staging-layer write (NEVER write directly to area_metric_values)
    INSERT INTO submissions (
        area_id,
        metric_id,
        value,
        note,
        evidence_url,
        source_type,
        agent_confidence,
        observed_at,
        created_at,
        status
    )
    VALUES (
        p_area_id,
        v_metric_id,
        p_value,
        p_note,
        p_source_url,
        COALESCE(p_source_type, 'agent_bootstrap'),
        CASE 
            WHEN p_agent_confidence IN ('low', 'medium', 'high') THEN p_agent_confidence 
            ELSE 'medium' 
        END,
        COALESCE(p_observed_at, CURRENT_DATE),
        now(),
        'accepted'
    )
    RETURNING id INTO v_inserted_id;

    RETURN jsonb_build_object(
        'success', true,
        'inserted_id', v_inserted_id
    );
END;
$$;


-- Function: recompute_area_metrics
-- Recomputes median values, sets confidence ratings, and updates city data_confidence
CREATE OR REPLACE FUNCTION recompute_area_metrics(p_area_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metric RECORD;
    v_city_id TEXT;
    v_sample_size INT;
    v_median_value NUMERIC;
    v_confidence TEXT;
    v_city_confidence TEXT;
    v_all_core_ready BOOLEAN := true;
BEGIN
    SELECT city_id INTO v_city_id FROM areas WHERE id = p_area_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Area not found');
    END IF;

    -- Process all metrics for this area
    FOR v_metric IN SELECT id, key FROM metrics LOOP
        SELECT 
            COUNT(*),
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)
        INTO v_sample_size, v_median_value
        FROM submissions
        WHERE area_id = p_area_id AND metric_id = v_metric.id AND status = 'accepted';

        IF v_sample_size > 0 AND v_median_value IS NOT NULL THEN
            -- Confidence rollup rules from 02-data-model-schema.md
            IF v_sample_size >= 20 THEN
                v_confidence := 'high';
            ELSIF v_sample_size >= 5 THEN
                v_confidence := 'medium';
            ELSIF v_sample_size >= 1 THEN
                v_confidence := 'low';
            ELSE
                v_confidence := 'estimated';
            END IF;

            INSERT INTO area_metric_values (
                area_id,
                metric_id,
                value,
                confidence,
                sample_size,
                computed_at
            )
            VALUES (
                p_area_id,
                v_metric.id,
                ROUND(v_median_value, 2),
                v_confidence,
                v_sample_size,
                now()
            )
            ON CONFLICT (area_id, metric_id) DO UPDATE SET
                value = EXCLUDED.value,
                confidence = EXCLUDED.confidence,
                sample_size = EXCLUDED.sample_size,
                computed_at = now();
        END IF;
    END LOOP;

    -- City-level data_confidence rollup: worst confidence among areas in the city
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'low') THEN 'low'
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'medium') THEN 'medium'
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'high') THEN 'high'
            ELSE 'low'
        END
    INTO v_city_confidence;

    UPDATE cities
    SET 
        data_confidence = v_city_confidence,
        bootstrap_status = 'enriched',
        last_refreshed_at = now()
    WHERE id = v_city_id;

    RETURN jsonb_build_object('success', true, 'area_id', p_area_id, 'city_id', v_city_id);
END;
$$;
