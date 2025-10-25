// const axios = require('axios');

// export default async function handler(req, res) {
// 	try {
// 		const response = await axios.get('https://radiko.jp/v3/station/region/full.xml', {
// 			headers: {
// 				// 'User-Agent': 'Mozilla/5.0 (compatible; RadikoBot/1.0)',
// 				'User-Agent': 'Mozilla/5.0',
// 			},
// 		});
// 		res.setHeader('Content-Type', 'application/xml');
// 		res.status(200).send(response.data);
// 	} catch (error) {
// 		console.error('❌ Axios error:', error.message);

// 		if (error.response) {
// 		console.error('❌ Status:', error.response.status);
// 		console.error('❌ Data:', error.response.data);
// 		} else if (error.request) {
// 		console.error('❌ No response received');
// 		}

// 		res.status(500).json({ error: 'Failed to fetch stations' });
// 	}
// }

export default async function handler(req, res) {
	try {
		const response = await fetch('https://radiko.jp/v3/station/region/full.xml', {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; RadikoBot/1.0)',
		},
		});

		if (!response.ok) {
		return res.status(500).json({ error: 'Failed to fetch XML' });
		}

		const xml = await response.text();
		res.setHeader('Content-Type', 'application/xml');
		res.status(200).send(xml);
	} catch (error) {
		console.error('❌ Fetch error:', error);
		res.status(500).json({ error: 'Server Error' });
	}
}