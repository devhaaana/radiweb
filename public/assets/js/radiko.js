console.log('🔥 radiko.js 실행 시작');

function getCurrentDate() {
	const now = new Date();

	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');

	return `${year}${month}${day}`;
}

function getCurrentTime() {
	const now = new Date();

	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');

	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function getAvailableStations() {
	const url = '/api/stations';
	try {
		const response = await fetch(url);
		if (!response.ok) {
		console.error(`❌ [Error] Failed to load station data. HTTP Status: ${response.status}`);
		return [];
		}
		const xmlText = await response.text();
		return xmlText;
	} catch (error) {
		console.error("❌ [Error] Fetching station data:", error);
		return [];
	}
}

function applyMarquee(elem, text) {
    const marqueeContainer = document.createElement('div');
	marqueeContainer.className = 'marquee';
	marqueeContainer.innerHTML = `
		<span>${text}</span>
		<span>${text}</span>
	`;

	elem.innerHTML = '';
	elem.appendChild(marqueeContainer);

}

function checkAndAnimateText(elem, text) {
	if (!elem || !text) return;
    const parent = elem.closest('.program-info-container') || elem.parentElement;

	const textWidth = elem.scrollWidth;
	const parentWidth = parent.offsetWidth;

	if (textWidth > parentWidth) {
		applyMarquee(elem, text);
	} else {
		elem.textContent = text;
	}
}

async function loadStationList(filterAreaId = null) {
	const xmlText = await getAvailableStations();

	if (!xmlText) {
		alert('방송국 목록을 불러오는데 실패했습니다.');
		return;
	}
	
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlText, "application/xml");
	
	const stations = xmlDoc.querySelectorAll('station');
	
	const container = document.querySelector('.station-list');
	if (!container) {
		console.error('❌ [Error] station-list 클래스를 가진 컨테이너가 없습니다.');
		return;
	}
	container.innerHTML = '';

	stations.forEach(station => {
		const id = station.querySelector('id')?.textContent || '';
		const name = station.querySelector('name')?.textContent || id;
		const areaId = station.querySelector('area_id')?.textContent || '';
		const logo_url = station.querySelector('logo')?.textContent || '';

		if (filterAreaId && areaId !== filterAreaId) return;

		const card = document.createElement('div');
		card.className = 'station-card';
		card.onclick = async () => {
			console.log(`📻 Station: ${id}, Area ID: ${areaId}`);
			updateGeoLayerColor(areaId);
			playStream(id, areaId);

            document.querySelectorAll('.station-card.selected').forEach(card => {
                card.classList.remove('selected');
            });
            card.classList.add('selected');

			const curentDate = getCurrentDate();
			const programInfo = await getProgramInfo(id, curentDate);

			const programTitle = document.querySelector('.program-title');
			const programPerformer = document.querySelector('.program-performer');
			const programImage = document.querySelector('.station-cover');

			if (programTitle) {
                programTitle.textContent = programInfo?.title || 'Now Playing';
                checkAndAnimateText(programTitle, programInfo?.title || 'Now Playing');
			}
            if (programPerformer) {
                programPerformer.textContent = programInfo?.performer || 'Unknown';
                checkAndAnimateText(programPerformer, programInfo?.performer || 'Unknown');
            }
            if (programImage) {
                programImage.src = programInfo?.image || 'assets/image/radiweb-icon.svg';
            }
		};
		const logo = document.createElement('img');
		logo.src = logo_url;
		logo.alt = `${name} logo`;

		const title = document.createElement('h3');
		title.textContent = name;

		card.appendChild(logo);
		card.appendChild(title);
		container.appendChild(card);
	});

	const countElem = document.getElementById('station-count');
	if (countElem) {
		countElem.textContent = `Station: ${container.childElementCount}`;
	}
}

async function playSelectedStation() {
	const select = document.getElementById('stationSelect');
	const stationId = select.value;
	const areaId = select.options[select.selectedIndex]?.dataset.areaId;

	if (!stationId || !areaId) {
		alert('방송국을 선택하거나 지역 정보가 없습니다.');
		return;
	}
	console.log(`📻 Station: ${id}, Area ID: ${areaId}`);

	await playStream(stationId, areaId);
}

// "YYYYMMDDhhmmss" -> ms timestamp
function parseRadikoTime(timeStr) {
	const year = Number(timeStr.slice(0, 4));
	const month = Number(timeStr.slice(4, 6)) - 1;
	const day = Number(timeStr.slice(6, 8));
	const hour = Number(timeStr.slice(8, 10));
	const min = Number(timeStr.slice(10, 12));
	const sec = Number(timeStr.slice(12, 14));

	return new Date(year, month, day, hour, min, sec).getTime();
}

function formatSeconds(seconds) {
	const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
	const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
	return `${mins}:${secs}`;
}

// 'YYYYMMDDhhmmss' -> 'hh:mm'
function formatHHmm(timeStr) {
    return timeStr.slice(8, 10) + ':' + timeStr.slice(10, 12);
}

function updateProgressBar(startTime, duration) {
	const now = Date.now();
	const elapsed = Math.max(0, (now - (startTime + 5000)) / 1000);
	const progress = Math.min(100, (elapsed / duration) * 100);

	const bar = document.getElementById('progress-bar');
	if (bar) {
		bar.value = progress;
	}

	const currentTimeElem = document.getElementById('current-time');
	const totalTimeElem = document.getElementById('total-time');
	if (currentTimeElem) currentTimeElem.textContent = formatSeconds(elapsed);
	if (totalTimeElem) totalTimeElem.textContent = formatSeconds(duration);

    const startTimeElem = document.getElementById('start-time');
    const endTimeElem = document.getElementById('end-time');
    if (startTimeElem && endTimeElem && window.currentProgramInfo) {
        startTimeElem.textContent = formatHHmm(window.currentProgramInfo.ft);
        endTimeElem.textContent = formatHHmm(window.currentProgramInfo.to);
    }
}

async function playStream(stationId, areaId) {
	if (!stationId || !areaId) {
		alert('방송국 ID 또는 지역 ID가 없습니다.');
		return;
	}
	
	try {
		const authRes = await fetch(`/api/auth?area_id=${areaId}`);
		const { token } = await authRes.json();

		const live_url = `https://f-radiko.smartstream.ne.jp/${stationId}/_definst_/simul-stream.stream/playlist.m3u8`;
		const chunkRes = await fetch(live_url, {
			headers: {
				'X-Radiko-AuthToken': token,
			},
		});
		const chunkText = await chunkRes.text();

		const lines = chunkText.split('\n');
		const chunkUrl = lines.find(line => /^https?:\/\/.+\.m3u8/.test(line));
		if (!chunkUrl) {
			console.error('❌ [Error] m3u8 chunk URL을 찾을 수 없습니다.');
			return;
		}

		const finalUrl = `${chunkUrl}?X-Radiko-AuthToken=${token}`;

		playHlsStream(finalUrl);

        const playPauseBtn = document.getElementById('playPauseBtn');
		const playIcon = playPauseBtn?.querySelector('i');
		if (playIcon) {
			playIcon.className = 'bi bi-pause-circle-fill';
		}

		const curentDate = getCurrentDate();
		const programInfo = await getProgramInfo(stationId, curentDate);

		if (programInfo?.ft && programInfo?.to) {
            window.currentProgramInfo = programInfo;

			const ft = parseRadikoTime(programInfo.ft);
			const to = parseRadikoTime(programInfo.to);

			const duration = (to - ft) / 1000;
			const start = ft;

			updateProgressBar(start, duration);
			clearInterval(window.progressTimer);

			window.progressTimer = setInterval(() => {
				updateProgressBar(start, duration);
			}, 1000);
		}

	} catch (err) {
		console.error('❌ [Error] 스트림 재생 중 오류:', err);
	}
}

async function getProgramInfo(stationId, date) {
	try {
		const url = `https://radiko.jp/v3/program/station/date/${date}/${stationId}.xml`;
		const res = await fetch(url);
		if (!res.ok) {
			console.error('❌ [Error] 프로그램 XML 불러오기 실패', res.status);
			return null;
		}

		const xml = await res.text();
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xml, "application/xml");

		const curremtTime = getCurrentTime();

		const progs = xmlDoc.querySelectorAll('prog');
		for (const prog of progs) {
			const ft = prog.getAttribute('ft');
			const to = prog.getAttribute('to');

			if (ft && to && ft <= curremtTime && curremtTime < to) {
				const titleTag = prog.querySelector('title');
				const pfmTag = prog.querySelector('pfm');
				const imgTag = prog.querySelector('img');

				if (titleTag && titleTag.textContent) {
					const title = titleTag.textContent;
					const performer = pfmTag.textContent || null;
					const image = imgTag?.textContent || null;

					return {
						title, performer, image, ft, to
					};

				}
			}
		}

		console.warn('⚠️ 현재 방송 프로그램 정보 없음');
		return null;
	} catch (err) {
			console.error('❌ [Error] 프로그램 이미지 가져오기 오류:', err);
		return null;
	}
}

let hls;

function playHlsStream(finalUrl) {
	const video = document.getElementById('player');
	if (Hls.isSupported()) {
		if (hls) {
			hls.destroy();
		}
		hls = new Hls();
		hls.loadSource(finalUrl);
		hls.attachMedia(video);

		hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const seekTime = Math.max(video.duration - 5, 0);
			video.currentTime = seekTime;
			video.play();
		});

	} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
		video.src = finalUrl;
		video.addEventListener('loadedmetadata', () => {
            const seekTime = Math.max(video.duration - 5, 0);
            video.currentTime = seekTime;
			video.play();
		});
	} else {
		alert('HLS 스트리밍을 지원하지 않는 브라우저입니다.');
	}
}

document.getElementById('playPauseBtn').addEventListener('click', () => {
	const video = document.getElementById('player');
	const icon = document.querySelector('#playPauseBtn i');

	if (video.paused) {
		if (hls) {
			hls.startLoad();
		}
        const seekTime = Math.max(video.duration - 5, 0);
        video.currentTime = seekTime;
		video.play();
		icon.className = 'bi bi-pause-circle-fill';
	} else {
		video.pause();
		icon.className = 'bi bi-play-circle-fill';
	}
});

window.onload = () => {
	loadStationList();
};

window.loadStationList = loadStationList;
