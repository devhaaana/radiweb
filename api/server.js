console.log('🔥 server.js 실행 시작');

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { XMLParser } = require('fast-xml-parser');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/radiko/stream/:app/:station_id', async (req, res) => {
	const { app: appType, station_id } = req.params;
	const url = `https://radiko.jp/v3/station/stream/${appType}/${station_id}.xml`;

	try {
		const response = await axios.get(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
				'Referer': 'https://radiko.jp/',
			},
		});

		const parser = new XMLParser();
		const json = parser.parse(response.data);

		const urls = json.urls?.url;
		let streamUrl = null;

		if (Array.isArray(urls)) {
			streamUrl = urls.find(u => u.playlist_create_url?.includes('m3u8'))?.playlist_create_url;
		} else if (typeof urls === 'object' && urls?.playlist_url) {
			streamUrl = urls.playlist_url;
		}

		if (!streamUrl) {
			console.error('❌ [Error] m3u8 URL을 찾을 수 없음. 응답 데이터:', JSON.stringify(urls, null, 2));
			return res.status(404).send('No stream URL found');
		}
		res.json({ streamUrl });
		console.log(streamUrl);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Failed to fetch stream URL');
	}
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
