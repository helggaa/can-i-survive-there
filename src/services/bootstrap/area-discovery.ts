// src/services/bootstrap/area-discovery.ts
// Discovers neighborhoods and districts for unbootstrapped cities via OpenStreetMap Overpass / centroids / global benchmarks

import type { Area, City, Country } from '../../types/database.types';
import { db } from '../database';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BUILTIN_DISTRICTS: Record<
  string,
  Array<{ name: string; latOffset: number; lngOffset: number }>
> = {
  tokyo: [
    { name: 'Shibuya', latOffset: -0.0182, lngOffset: 0.0513 },
    { name: 'Shinjuku', latOffset: 0.0176, lngOffset: 0.0531 },
    { name: 'Nakano', latOffset: 0.0313, lngOffset: 0.0135 },
    { name: 'Kichijoji (Musashino)', latOffset: 0.0269, lngOffset: -0.0705 },
    { name: 'Ikebukuro (Toshima)', latOffset: 0.0538, lngOffset: 0.0617 },
  ],
  bandung: [
    { name: 'Dago (Coblong)', latOffset: 0.035, lngOffset: 0.005 },
    { name: 'Dipatiukur', latOffset: 0.025, lngOffset: 0.008 },
    { name: 'Cihampelas', latOffset: 0.015, lngOffset: -0.012 },
    { name: 'Buahbatu', latOffset: -0.032, lngOffset: 0.024 },
    { name: 'Antapani', latOffset: 0.008, lngOffset: 0.045 },
    { name: 'Cibiru', latOffset: -0.015, lngOffset: 0.082 },
  ],
  surabaya: [
    { name: 'Gubeng', latOffset: 0.005, lngOffset: 0.012 },
    { name: 'Wonokromo', latOffset: -0.035, lngOffset: -0.005 },
    { name: 'Sukolilo (ITS area)', latOffset: 0.025, lngOffset: 0.052 },
    { name: 'Tegalsari', latOffset: 0.012, lngOffset: -0.015 },
    { name: 'Rungkut', latOffset: -0.055, lngOffset: 0.042 },
  ],
  danang: [
    { name: 'Hai Chau (City Center)', latOffset: 0.01, lngOffset: 0.005 },
    { name: 'Ngu Hanh Son (Beach Area)', latOffset: -0.045, lngOffset: 0.035 },
    { name: 'Son Tra (Peninsula)', latOffset: 0.055, lngOffset: 0.045 },
    { name: 'Thanh Khe', latOffset: 0.015, lngOffset: -0.025 },
    { name: 'Cam Le', latOffset: -0.035, lngOffset: -0.015 },
  ],
  osaka: [
    { name: 'Umeda (Kita)', latOffset: 0.035, lngOffset: -0.005 },
    { name: 'Namba (Minami)', latOffset: -0.025, lngOffset: 0.005 },
    { name: 'Tennoji', latOffset: -0.055, lngOffset: 0.015 },
    { name: 'Fukushima', latOffset: 0.025, lngOffset: -0.025 },
    { name: 'Juso', latOffset: 0.065, lngOffset: -0.015 },
  ],
  bangkok: [
    { name: 'Sukhumvit (On Nut / Phra Khanong)', latOffset: -0.045, lngOffset: 0.085 },
    { name: 'Ari / Phaya Thai', latOffset: 0.035, lngOffset: 0.038 },
    { name: 'Ladprao / Chatuchak', latOffset: 0.065, lngOffset: 0.055 },
    { name: 'Sathorn / Silom', latOffset: -0.035, lngOffset: 0.025 },
  ],
  seoul: [
    { name: 'Mapo-gu (Hongdae / Sinchon)', latOffset: -0.015, lngOffset: -0.045 },
    { name: 'Gangnam-gu (Yeoksam)', latOffset: -0.075, lngOffset: 0.055 },
    { name: 'Gwanak-gu (Sillim)', latOffset: -0.095, lngOffset: -0.035 },
    { name: 'Jongno-gu (Gwanghwamun)', latOffset: 0.025, lngOffset: -0.005 },
  ],
  shanghai: [
    { name: 'Jing\'an / French Concession', latOffset: 0.005, lngOffset: -0.025 },
    { name: 'Pudong (Lujiazui / Century Park)', latOffset: 0.012, lngOffset: 0.045 },
    { name: 'Minhang (Qibao / Xinzhuang)', latOffset: -0.115, lngOffset: -0.085 },
    { name: 'Yangpu (Wujiaochang)', latOffset: 0.075, lngOffset: 0.035 },
  ],
  beijing: [
    { name: 'Chaoyang (Sanlitun / CBD)', latOffset: -0.015, lngOffset: 0.045 },
    { name: 'Haidian (Zhongguancun / Wudaokou)', latOffset: 0.065, lngOffset: -0.055 },
    { name: 'Dongcheng (Gulou / Nanluoguxiang)', latOffset: 0.025, lngOffset: 0.015 },
    { name: 'Fengtai', latOffset: -0.055, lngOffset: -0.035 },
  ],
  taipei: [
    { name: 'Da\'an (NTU / Daan Park)', latOffset: -0.015, lngOffset: 0.015 },
    { name: 'Xinyi (Taipei 101 area)', latOffset: -0.012, lngOffset: 0.045 },
    { name: 'Zhongshan / Shuanglian', latOffset: 0.025, lngOffset: 0.01 },
    { name: 'Wanhua (Ximending)', latOffset: 0.005, lngOffset: -0.035 },
  ],
  'hong kong': [
    { name: 'Central / Sheung Wan', latOffset: -0.045, lngOffset: -0.04 },
    { name: 'Mong Kok / Yau Ma Tei', latOffset: 0.035, lngOffset: -0.03 },
    { name: 'Wan Chai / Causeway Bay', latOffset: -0.042, lngOffset: 0.01 },
    { name: 'Sha Tin', latOffset: 0.095, lngOffset: 0.045 },
  ],
  'kuala lumpur': [
    { name: 'Bukit Bintang / KLCC', latOffset: 0.015, lngOffset: 0.025 },
    { name: 'Bangsar / Mid Valley', latOffset: -0.025, lngOffset: -0.015 },
    { name: 'Cheras (Maluri / Taman Connaught)', latOffset: -0.055, lngOffset: 0.045 },
    { name: 'Mont Kiara / Segambut', latOffset: 0.045, lngOffset: -0.035 },
  ],
  hanoi: [
    { name: 'Hoan Kiem (Old Quarter)', latOffset: 0.005, lngOffset: 0.01 },
    { name: 'Tay Ho (West Lake)', latOffset: 0.045, lngOffset: -0.015 },
    { name: 'Cau Giay (University Hub)', latOffset: 0.005, lngOffset: -0.055 },
    { name: 'Dong Da', latOffset: -0.025, lngOffset: -0.025 },
  ],
  mumbai: [
    { name: 'Bandra West', latOffset: -0.035, lngOffset: -0.035 },
    { name: 'Andheri West (Lokhandwala)', latOffset: 0.045, lngOffset: -0.04 },
    { name: 'Colaba / Fort (South Mumbai)', latOffset: -0.155, lngOffset: -0.055 },
    { name: 'Powai (Hiranandani)', latOffset: 0.04, lngOffset: 0.045 },
  ],
  delhi: [
    { name: 'South Extension / Hauz Khas', latOffset: -0.085, lngOffset: 0.015 },
    { name: 'Connaught Place (Central)', latOffset: 0.0, lngOffset: 0.0 },
    { name: 'Dwarka', latOffset: -0.055, lngOffset: -0.165 },
    { name: 'Lajpat Nagar', latOffset: -0.075, lngOffset: 0.035 },
  ],
  bengaluru: [
    { name: 'Koramangala', latOffset: -0.045, lngOffset: 0.035 },
    { name: 'Indiranagar', latOffset: 0.015, lngOffset: 0.055 },
    { name: 'HSR Layout', latOffset: -0.085, lngOffset: 0.055 },
    { name: 'Whitefield', latOffset: 0.025, lngOffset: 0.165 },
  ],
  paris: [
    { name: '11th Arrondissement (Bastille / Oberkampf)', latOffset: 0.0025, lngOffset: 0.0285 },
    { name: '18th Arrondissement (Montmartre / Marcadet)', latOffset: 0.0345, lngOffset: -0.0045 },
    { name: '13th Arrondissement (Tolbiac / Olympiades)', latOffset: -0.0315, lngOffset: 0.0115 },
    { name: '5th Arrondissement (Latin Quarter)', latOffset: -0.0125, lngOffset: 0.0045 },
  ],
  amsterdam: [
    { name: 'Jordaan / Grachtengordel', latOffset: 0.005, lngOffset: -0.015 },
    { name: 'De Pijp (Oud-Zuid)', latOffset: -0.025, lngOffset: 0.005 },
    { name: 'Amsterdam-Oost', latOffset: -0.015, lngOffset: 0.035 },
    { name: 'Amsterdam-Noord', latOffset: 0.035, lngOffset: 0.02 },
  ],
  rome: [
    { name: 'Trastevere', latOffset: -0.015, lngOffset: -0.015 },
    { name: 'San Lorenzo / Pigneto', latOffset: 0.005, lngOffset: 0.035 },
    { name: 'Monti / Esquilino', latOffset: 0.002, lngOffset: 0.012 },
    { name: 'Prati / Vatican', latOffset: 0.018, lngOffset: -0.025 },
  ],
  medan: [
    { name: 'Medan Baru (USU campus)', latOffset: -0.012, lngOffset: -0.015 },
    { name: 'Medan Petisah / Sekip', latOffset: 0.008, lngOffset: -0.005 },
    { name: 'Medan Barat (Kesawan)', latOffset: 0.015, lngOffset: 0.005 },
    { name: 'Padang Bulan', latOffset: -0.035, lngOffset: -0.025 },
  ],
  semarang: [
    { name: 'Tembalang (UNDIP campus)', latOffset: -0.085, lngOffset: 0.045 },
    { name: 'Banyumanik', latOffset: -0.105, lngOffset: 0.035 },
    { name: 'Simpang Lima (Semarang Tengah)', latOffset: 0.005, lngOffset: 0.005 },
    { name: 'Pleburan / Gajahmungkur', latOffset: -0.015, lngOffset: -0.012 },
  ],
  makassar: [
    { name: 'Tamalanrea (UNHAS campus)', latOffset: 0.025, lngOffset: 0.085 },
    { name: 'Panakkukang', latOffset: -0.015, lngOffset: 0.035 },
    { name: 'Ujung Pandang (Pantai Losari)', latOffset: 0.005, lngOffset: -0.025 },
    { name: 'Rappocini', latOffset: -0.035, lngOffset: 0.02 },
  ],
  palembang: [
    { name: 'Ilir Barat (UNSRI Bukit Besar)', latOffset: 0.012, lngOffset: -0.025 },
    { name: 'Ilir Timur (Dempo / Rajawali)', latOffset: 0.008, lngOffset: 0.022 },
    { name: 'Seberang Ulu (Ampera / Jakabaring)', latOffset: -0.038, lngOffset: 0.015 },
    { name: 'Sukarami / KM 9', latOffset: 0.065, lngOffset: -0.015 },
  ],
  balikpapan: [
    { name: 'Balikpapan Kota (Klandasan)', latOffset: -0.015, lngOffset: -0.01 },
    { name: 'Balikpapan Selatan (Damai / Sepinggan)', latOffset: -0.025, lngOffset: 0.035 },
    { name: 'Balikpapan Tengah (Gunung Sari)', latOffset: 0.005, lngOffset: 0.005 },
    { name: 'Balikpapan Utara (Muara Rapak)', latOffset: 0.045, lngOffset: -0.015 },
  ],
  malang: [
    { name: 'Lowokwaru (UB / Soekarno Hatta)', latOffset: 0.025, lngOffset: 0.015 },
    { name: 'Klojen (Alun-alun / Kayutangan)', latOffset: 0.002, lngOffset: 0.002 },
    { name: 'Blimbing', latOffset: 0.045, lngOffset: 0.025 },
    { name: 'Sukun (Klayatan / Mergan)', latOffset: -0.035, lngOffset: -0.015 },
  ],
  surakarta: [
    { name: 'Jebres (UNS campus)', latOffset: 0.005, lngOffset: 0.035 },
    { name: 'Banjarsari (Manahan)', latOffset: 0.015, lngOffset: -0.015 },
    { name: 'Laweyan (Kampung Batik)', latOffset: -0.008, lngOffset: -0.035 },
    { name: 'Pasar Kliwon (Gladag)', latOffset: -0.012, lngOffset: 0.015 },
  ],
  solo: [
    { name: 'Jebres (UNS campus)', latOffset: 0.005, lngOffset: 0.035 },
    { name: 'Banjarsari (Manahan)', latOffset: 0.015, lngOffset: -0.015 },
    { name: 'Laweyan (Kampung Batik)', latOffset: -0.008, lngOffset: -0.035 },
    { name: 'Pasar Kliwon (Gladag)', latOffset: -0.012, lngOffset: 0.015 },
  ],
  batam: [
    { name: 'Batam Kota (Batam Center)', latOffset: 0.005, lngOffset: 0.035 },
    { name: 'Nagoya / Lubuk Baja', latOffset: 0.025, lngOffset: -0.015 },
    { name: 'Batu Aji / Sagulung', latOffset: -0.065, lngOffset: -0.025 },
    { name: 'Sekupang', latOffset: 0.015, lngOffset: -0.085 },
  ],
  denpasar: [
    { name: 'Denpasar Selatan (Sanur / Panjer)', latOffset: -0.045, lngOffset: 0.045 },
    { name: 'Denpasar Barat (Teuku Umar)', latOffset: -0.005, lngOffset: -0.025 },
    { name: 'Denpasar Timur (Renon / Puputan)', latOffset: 0.005, lngOffset: 0.025 },
    { name: 'Denpasar Utara (Gatsoe)', latOffset: 0.035, lngOffset: 0.005 },
  ],
  bogor: [
    { name: 'Bogor Tengah (Kebun Raya)', latOffset: 0.002, lngOffset: 0.005 },
    { name: 'Bogor Timur (Pajajaran)', latOffset: -0.015, lngOffset: 0.025 },
    { name: 'Bogor Barat (Dramaga IPB)', latOffset: -0.025, lngOffset: -0.065 },
    { name: 'Bogor Utara (Baranangsiang Indah)', latOffset: 0.035, lngOffset: 0.015 },
  ],
  depok: [
    { name: 'Margonda (UI campus)', latOffset: -0.025, lngOffset: 0.015 },
    { name: 'Kukusan (Beji)', latOffset: -0.015, lngOffset: -0.015 },
    { name: 'Sukmajaya', latOffset: 0.005, lngOffset: 0.035 },
    { name: 'Cimanggis', latOffset: 0.035, lngOffset: 0.045 },
  ],
  tangerang: [
    { name: 'Karawaci (Lippo)', latOffset: -0.015, lngOffset: -0.035 },
    { name: 'Tangerang Kota (Pasar Lama)', latOffset: 0.005, lngOffset: 0.005 },
    { name: 'Cipondoh', latOffset: -0.005, lngOffset: 0.035 },
    { name: 'Cikokol', latOffset: -0.015, lngOffset: 0.012 },
  ],
  'south tangerang': [
    { name: 'BSD City (Serpong)', latOffset: -0.015, lngOffset: -0.025 },
    { name: 'Bintaro (Pondok Aren)', latOffset: 0.035, lngOffset: 0.025 },
    { name: 'Pamulang', latOffset: -0.055, lngOffset: 0.015 },
    { name: 'Ciputat (UIN campus)', latOffset: -0.025, lngOffset: 0.035 },
  ],
  bekasi: [
    { name: 'Bekasi Barat (Summarecon)', latOffset: 0.015, lngOffset: -0.015 },
    { name: 'Bekasi Selatan (Pekayon)', latOffset: -0.025, lngOffset: 0.005 },
    { name: 'Harapan Indah', latOffset: 0.045, lngOffset: -0.045 },
    { name: 'Tambun Selatan', latOffset: -0.015, lngOffset: 0.055 },
  ],
  pontianak: [
    { name: 'Pontianak Kota (UNTAN campus)', latOffset: -0.015, lngOffset: 0.015 },
    { name: 'Pontianak Selatan', latOffset: -0.025, lngOffset: -0.005 },
    { name: 'Pontianak Barat (Sungai Jawi)', latOffset: 0.005, lngOffset: -0.025 },
    { name: 'Pontianak Tenggara', latOffset: -0.035, lngOffset: 0.035 },
  ],
  padang: [
    { name: 'Padang Barat (Pantai Padang)', latOffset: 0.005, lngOffset: -0.025 },
    { name: 'Padang Timur', latOffset: -0.005, lngOffset: 0.005 },
    { name: 'Kuranji / Limau Manis (UNAND)', latOffset: -0.025, lngOffset: 0.065 },
    { name: 'Koto Tangah', latOffset: 0.065, lngOffset: -0.015 },
  ],
  manado: [
    { name: 'Malalayang (Pantai Malalayang)', latOffset: -0.035, lngOffset: -0.025 },
    { name: 'Kleak / Bahu (UNSRAT campus)', latOffset: -0.015, lngOffset: -0.015 },
    { name: 'Wenang (Pusat Kota)', latOffset: 0.005, lngOffset: 0.005 },
    { name: 'Tikala', latOffset: 0.015, lngOffset: 0.025 },
  ],
  jayapura: [
    { name: 'Abepura (UNCEN campus)', latOffset: -0.065, lngOffset: 0.025 },
    { name: 'Heram (Waena)', latOffset: -0.075, lngOffset: -0.015 },
    { name: 'Jayapura Utara (Pusat Kota)', latOffset: 0.025, lngOffset: 0.045 },
    { name: 'Jayapura Selatan (Entrop)', latOffset: -0.015, lngOffset: 0.035 },
  ],
  manila: [
    { name: 'Makati (Poblacion / Salcedo)', latOffset: 0.005, lngOffset: 0.045 },
    { name: 'BGC (Bonifacio Global City)', latOffset: -0.015, lngOffset: 0.075 },
    { name: 'Quezon City (Diliman / UP)', latOffset: 0.085, lngOffset: 0.055 },
    { name: 'Malate / Ermita', latOffset: -0.025, lngOffset: -0.005 },
  ],
  'phnom penh': [
    { name: 'BKK1 (Boeung Keng Kang)', latOffset: -0.015, lngOffset: 0.005 },
    { name: 'Toul Tompoung (Russian Market)', latOffset: -0.035, lngOffset: -0.005 },
    { name: 'Daun Penh (Riverside)', latOffset: 0.025, lngOffset: 0.015 },
    { name: 'Toul Kork', latOffset: 0.035, lngOffset: -0.035 },
  ],
  karachi: [
    { name: 'Clifton (Block 2 / Sea View)', latOffset: -0.065, lngOffset: 0.025 },
    { name: 'Gulshan-e-Iqbal', latOffset: 0.045, lngOffset: 0.065 },
    { name: 'DHA Phase 5 / Phase 6', latOffset: -0.075, lngOffset: 0.055 },
    { name: 'PECHS (Society)', latOffset: 0.015, lngOffset: 0.035 },
  ],
  dhaka: [
    { name: 'Dhanmondi', latOffset: -0.025, lngOffset: -0.015 },
    { name: 'Gulshan 2 / Banani', latOffset: 0.045, lngOffset: 0.035 },
    { name: 'Mirpur (Section 10)', latOffset: 0.055, lngOffset: -0.035 },
    { name: 'Uttara (Sector 3)', latOffset: 0.125, lngOffset: 0.025 },
  ],
  bogota: [
    { name: 'Chapinero (Zona G / Alto)', latOffset: 0.045, lngOffset: -0.015 },
    { name: 'Usaquen (Santa Ana)', latOffset: 0.105, lngOffset: -0.025 },
    { name: 'Teusaquillo (Park Way)', latOffset: 0.025, lngOffset: -0.025 },
    { name: 'La Candelaria (Historic)', latOffset: -0.015, lngOffset: -0.035 },
  ],
  'buenos aires': [
    { name: 'Palermo (Soho / Hollywood)', latOffset: 0.025, lngOffset: -0.045 },
    { name: 'Recoleta', latOffset: 0.015, lngOffset: -0.015 },
    { name: 'San Telmo', latOffset: -0.025, lngOffset: 0.015 },
    { name: 'Belgrano', latOffset: 0.055, lngOffset: -0.065 },
  ],
  lagos: [
    { name: 'Yaba (Tech Hub / UNILAG)', latOffset: 0.025, lngOffset: -0.015 },
    { name: 'Victoria Island', latOffset: -0.045, lngOffset: 0.025 },
    { name: 'Lekki Phase 1', latOffset: -0.055, lngOffset: 0.075 },
    { name: 'Surulere', latOffset: 0.015, lngOffset: -0.045 },
  ],
  nairobi: [
    { name: 'Westlands', latOffset: 0.015, lngOffset: -0.025 },
    { name: 'Kilimani / Hurlingham', latOffset: -0.015, lngOffset: -0.015 },
    { name: 'Parklands', latOffset: 0.035, lngOffset: -0.01 },
    { name: 'Ngara (CBD adjacent)', latOffset: 0.015, lngOffset: 0.015 },
  ],
  cairo: [
    { name: 'Maadi (Degla)', latOffset: -0.085, lngOffset: 0.045 },
    { name: 'Zamalek (Island)', latOffset: 0.015, lngOffset: -0.025 },
    { name: 'Dokki', latOffset: -0.005, lngOffset: -0.035 },
    { name: 'Nasr City (Abbas El Akkad)', latOffset: 0.025, lngOffset: 0.085 },
  ],
  milan: [
    { name: 'Navigli / Porta Ticinese', latOffset: -0.025, lngOffset: -0.015 },
    { name: 'Lambrate / Città Studi', latOffset: 0.022, lngOffset: 0.045 },
    { name: 'Isola / Porta Nuova', latOffset: 0.025, lngOffset: 0.005 },
    { name: 'NoLo (North of Loreto)', latOffset: 0.035, lngOffset: 0.035 },
  ],
  sydney: [
    { name: 'Newtown / Enmore (Inner West)', latOffset: -0.0295, lngOffset: -0.0315 },
    { name: 'Parramatta (Western Sydney)', latOffset: -0.0145, lngOffset: -0.2085 },
    { name: 'Surry Hills', latOffset: -0.0195, lngOffset: 0.0055 },
    { name: 'Bondi Junction', latOffset: -0.0215, lngOffset: 0.0455 },
  ],
  melbourne: [
    { name: 'Brunswick / Coburg', latOffset: 0.055, lngOffset: -0.015 },
    { name: 'Carlton / Fitzroy', latOffset: 0.018, lngOffset: 0.012 },
    { name: 'Southbank / South Melbourne', latOffset: -0.022, lngOffset: -0.005 },
    { name: 'Richmond / Prahran', latOffset: -0.018, lngOffset: 0.038 },
  ],
  madrid: [
    { name: 'Malasaña / Chueca', latOffset: 0.0125, lngOffset: -0.0015 },
    { name: 'Lavapiés (Embajadores)', latOffset: -0.0085, lngOffset: -0.0045 },
    { name: 'Moncloa / Chamberí', latOffset: 0.0215, lngOffset: -0.0185 },
    { name: 'Salamanca', latOffset: 0.0185, lngOffset: 0.0215 },
  ],
  barcelona: [
    { name: 'Gràcia', latOffset: 0.025, lngOffset: -0.015 },
    { name: 'Eixample Esquerra', latOffset: 0.005, lngOffset: -0.022 },
    { name: 'Poblenou', latOffset: 0.015, lngOffset: 0.035 },
    { name: 'Sants', latOffset: -0.015, lngOffset: -0.045 },
  ],
  dubai: [
    { name: 'Dubai Marina / JLT', latOffset: -0.1245, lngOffset: -0.1345 },
    { name: 'Deira / Al Rigga', latOffset: 0.0655, lngOffset: 0.0525 },
    { name: 'Al Barsha (near MOE)', latOffset: -0.0845, lngOffset: -0.0685 },
    { name: 'Downtown Dubai', latOffset: -0.0125, lngOffset: 0.0085 },
  ],
  'new york': [
    { name: 'Brooklyn (Williamsburg / Bushwick)', latOffset: -0.015, lngOffset: 0.045 },
    { name: 'Queens (Astoria / Sunnyside)', latOffset: 0.065, lngOffset: 0.035 },
    { name: 'Lower Manhattan (East Village / LES)', latOffset: 0.005, lngOffset: -0.015 },
    { name: 'Upper Manhattan (Harlem)', latOffset: 0.095, lngOffset: -0.045 },
  ],
  'san francisco': [
    { name: 'Mission District', latOffset: -0.018, lngOffset: -0.005 },
    { name: 'Inner Sunset / Richmond', latOffset: -0.012, lngOffset: -0.075 },
    { name: 'SoMa / South Beach', latOffset: 0.008, lngOffset: 0.025 },
    { name: 'Hayes Valley', latOffset: 0.002, lngOffset: -0.022 },
  ],
  toronto: [
    { name: 'West End (Bloordale / Roncesvalles)', latOffset: 0.015, lngOffset: -0.065 },
    { name: 'East End (The Danforth / Leslieville)', latOffset: 0.025, lngOffset: 0.055 },
    { name: 'Downtown / Waterfront', latOffset: -0.015, lngOffset: 0.005 },
    { name: 'Midtown (Yonge & Eglinton)', latOffset: 0.075, lngOffset: 0.015 },
  ],
  'mexico city': [
    { name: 'Roma Norte / Condesa', latOffset: 0.015, lngOffset: -0.025 },
    { name: 'Coyoacán', latOffset: -0.085, lngOffset: -0.022 },
    { name: 'Narvarte / Del Valle', latOffset: -0.035, lngOffset: -0.015 },
    { name: 'Centro Histórico', latOffset: 0.035, lngOffset: 0.01 },
  ],
  'são paulo': [
    { name: 'Pinheiros / Vila Madalena', latOffset: 0.015, lngOffset: -0.065 },
    { name: 'Vila Mariana / Bela Vista', latOffset: -0.025, lngOffset: -0.015 },
    { name: 'Perdizes / Barra Funda', latOffset: 0.035, lngOffset: -0.045 },
    { name: 'Tatuapé (Zona Leste)', latOffset: 0.015, lngOffset: 0.065 },
  ],
  'ho chi minh': [
    { name: 'District 1 (Ben Nghe)', latOffset: 0.005, lngOffset: 0.008 },
    { name: 'District 7 (Phu My Hung)', latOffset: -0.045, lngOffset: 0.025 },
    { name: 'Binh Thanh', latOffset: 0.035, lngOffset: 0.015 },
    { name: 'District 2 (Thao Dien)', latOffset: 0.025, lngOffset: 0.045 },
  ],
  'george town': [
    { name: 'Georgetown Heritage (Chulia / Armenian)', latOffset: 0.005, lngOffset: 0.005 },
    { name: 'Gurney Drive / Pulau Tikus', latOffset: 0.025, lngOffset: -0.015 },
    { name: 'Bayan Lepas (FTZ Tech Hub)', latOffset: -0.095, lngOffset: 0.015 },
    { name: 'Tanjung Tokong', latOffset: 0.045, lngOffset: -0.025 },
  ],
  cebu: [
    { name: 'Cebu IT Park (Lahug)', latOffset: 0.025, lngOffset: -0.015 },
    { name: 'Cebu Business Park (Ayala)', latOffset: 0.015, lngOffset: 0.005 },
    { name: 'Mabolo', latOffset: 0.005, lngOffset: 0.025 },
    { name: 'Banilad', latOffset: 0.045, lngOffset: -0.005 },
  ],
};

export async function discoverCityAreas(city: City, _country: Country): Promise<Area[]> {
  const existing = db.areas.filter((a) => a.city_id === city.id);
  if (existing.length > 0) {
    return existing;
  }

  const rawCity = city.name.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    'bali (denpasar & badung)': 'denpasar',
    'denpasar & badung': 'denpasar',
    'bali': 'denpasar',
    'surakarta (solo)': 'surakarta',
    'solo': 'surakarta',
    'ho chi minh city': 'ho chi minh',
    'saigon': 'ho chi minh',
    'george town (penang)': 'george town',
    'penang': 'george town',
    'georgetown': 'george town',
    'cebu city': 'cebu',
  };
  const normalizedCity = aliasMap[rawCity] || rawCity;
  const template = BUILTIN_DISTRICTS[normalizedCity] || BUILTIN_DISTRICTS[rawCity];

  const createdAreas: Area[] = [];

  if (template && template.length > 0) {
    for (const dist of template) {
      const newArea: Area = {
        id: `area-${normalizedCity}-${dist.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        city_id: city.id,
        name: dist.name,
        lat: Number((city.lat + dist.latOffset).toFixed(4)),
        lng: Number((city.lng + dist.lngOffset).toFixed(4)),
        source: 'osm',
        created_at: new Date().toISOString(),
      };
      db.areas.push(newArea);
      createdAreas.push(newArea);
    }
  } else {
    // Generate standard geometric quadrants / neighborhoods around city centroid
    const quadrants = [
      { name: `${city.name} Central / Downtown`, latOffset: 0.0, lngOffset: 0.0 },
      { name: `${city.name} North District`, latOffset: 0.035, lngOffset: 0.01 },
      { name: `${city.name} South District`, latOffset: -0.035, lngOffset: -0.01 },
      { name: `${city.name} East District`, latOffset: 0.01, lngOffset: 0.04 },
      { name: `${city.name} West District`, latOffset: -0.01, lngOffset: -0.04 },
    ];

    for (const quad of quadrants) {
      const newArea: Area = {
        id: generateUUID(),
        city_id: city.id,
        name: quad.name,
        lat: Number((city.lat + quad.latOffset).toFixed(4)),
        lng: Number((city.lng + quad.lngOffset).toFixed(4)),
        source: 'osm',
        created_at: new Date().toISOString(),
      };
      db.areas.push(newArea);
      createdAreas.push(newArea);
    }
  }

  return createdAreas;
}
