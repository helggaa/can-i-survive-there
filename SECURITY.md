# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture

This application operates strictly under privacy-first and security-conscious standards:
- **No Paid or Tracking APIs**: Routing and Geocoding rely entirely on open OpenStreetMap (OSRM & Nominatim) protocols without tracking user location histories.
- **Input Sanitization & Validation**: All user submissions undergo strict multi-rule database validation and country-level GNI PPP sanity bands before entering staging.
- **Staging Isolation**: Direct writes to metrics tables are blocked by database constraints. All external contributions land in isolated staging logs until validated.
- **Zero Secret Exposure**: No private keys or service roles are bundled in frontend assets.

## Reporting a Vulnerability

If you discover a security issue or vulnerability, please report it responsibly by opening a Private Vulnerability Advisory on GitHub or contacting the maintainers. Please do not publish public issues for zero-day exploits before maintainers have investigated.
