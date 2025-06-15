console.log('🔥 geojson.js 실행 시작');

function getColorByAreaId(areaId) {
  const colorMap = {
    'JP1' : '#1b2b52',   // 홋카이도
    'JP2' : '#5c9bd1',   // 아오모리
    'JP3' : '#9f5f9f',   // 이와테
    'JP4' : '#007bbb',   // 미야기
    'JP5' : '#8b81c3',   // 아키타
    'JP6' : '#33a27b',   // 야마가타
    'JP7' : '#2f9c5e',   // 후쿠시마
    'JP8' : '#f08300',   // 이바라키
    'JP9' : '#e60033',   // 토치기
    'JP10': '#9e3d3f',   // 군마
    'JP11': '#d05a6e',   // 사이타마
    'JP12': '#0095d9',   // 지바
    'JP13': '#800080',   // 도쿄
    'JP14': '#0079c2',   // 가나가와
    'JP15': '#26453d',   // 니가타
    'JP16': '#00a968',   // 도야마
    'JP17': '#884898',   // 이시카와
    'JP18': '#7b90d2',   // 후쿠이
    'JP19': '#9f353a',   // 야마나시
    'JP20': '#826631',   // 나가노
    'JP21': '#33a6b8',   // 기후
    'JP22': '#de7953',   // 시즈오카
    'JP23': '#f08300',   // 아이치
    'JP24': '#b55d4c',   // 미에
    'JP25': '#3e62ad',   // 시가
    'JP26': '#6a0dad',   // 교토
    'JP27': '#007b8a',   // 오사카
    'JP28': '#2e8b57',   // 효고
    'JP29': '#745399',   // 나라
    'JP30': '#e87a90',   // 와카야마
    'JP31': '#33a27b',   // 돗토리
    'JP32': '#6c6024',   // 시마네
    'JP33': '#3f4e62',   // 오카야마
    'JP34': '#c1328e',   // 히로시마
    'JP35': '#b7282e',   // 야마구치
    'JP36': '#aa4c8f',   // 도쿠시마
    'JP37': '#f596aa',   // 카가와
    'JP38': '#f17c67',   // 에히메
    'JP39': '#d05a6e',   // 고치
    'JP40': '#007b43',   // 후쿠오카
    'JP41': '#c1a470',   // 사가
    'JP42': '#7b90d2',   // 나가사키
    'JP43': '#884c3a',   // 구마모토
    'JP44': '#db8449',   // 오이타
    'JP45': '#c53d43',   // 미야자키
    'JP46': '#b7282e',   // 가고시마
    'JP47': '#d40000'    // 오키나와
    };

    return colorMap[areaId] || '#cccccc';
}

let selectedLayer = null;

window.addEventListener('load', () => {
    console.log('🌏 지도 초기화 시작');

    const map = L.map('map', {
        maxBounds: [
            [20.0, 122.0],
            [46.0, 154.0]
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 5,
        maxZoom: 10
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(map);

    fetch('assets/data/japan.geojson')
        .then(res => res.json())
        .then(data => {
            const geoLayer = L.geoJSON(data, {
                style: feature => ({
                    color: '#444',
                    weight: 1,
                    fillColor: '#f2f2f2',
                    fillOpacity: 0.7
                }),
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.nam_kr || feature.properties.nam_ja;
                    layer.bindTooltip(name);

                    layer.on('click', () => {
                        if (selectedLayer) {
                            selectedLayer.setStyle({ fillColor: '#f2f2f2', fillOpacity: 0.7 });
                        }
                        layer.setStyle({ fillColor: '#ff4444', fillOpacity: 0.9 });
                        selectedLayer = layer;

                        const id = feature.properties.id;
                        const areaId = 'JP' + id.toString();
                        console.log('📍 선택된 지역 areaId:', areaId);

                        if (typeof loadStationList === 'function') {
                            loadStationList(areaId);
                        } else {
                            console.warn('⚠️ loadStationList 함수가 정의되지 않았습니다.');
                        }
                    });
                }
            }).addTo(map);
            window.geoLayer = geoLayer;
            map.fitBounds(geoLayer.getBounds());
        })
        .catch(err => console.error('❌ [Error] GeoJSON 로드 실패:', err));
});

window.updateGeoLayerColor = function(areaId) {
    if (!window.geoLayer) {
        console.warn('⚠️ geoLayer가 아직 생성되지 않았습니다.');
        return;
    }
    // console.log('🌏 지도 업데이트 시작: ', areaId);

    geoLayer.eachLayer(layer => {
        const id = layer.feature.properties.id;
        const jpCode = `JP${id.toString()}`;

        if (jpCode === areaId) {
            layer.setStyle({ fillColor: getColorByAreaId(jpCode), fillOpacity: 0.9 });
        } else {
            layer.setStyle({ fillColor: '#f2f2f2', fillOpacity: 0.7 });
        }
    });
};