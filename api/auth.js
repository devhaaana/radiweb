import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
    try {
        const area_id = req.query.area_id;
        const token = await accessAuthentication({
            app: 'aSmartPhone7o',
            version: '0.0.1',
            device: 'server.Radiko',
            user_id: crypto.randomUUID(),
            auth_key: process.env.AUTH_KEY,
            coordinate: getGPS(area_id)
        });

        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Auth failed', detail: err.message });
    }
}

import { Buffer } from 'buffer';
import crypto from 'crypto';
import axios from 'axios';

export async function accessAuthentication({ app, version, device, user_id, auth_key, coordinate }) {
    const auth1Res = await axios.get('https://radiko.jp/v2/api/auth1', {
        headers: {
        'X-Radiko-App': app,
        'X-Radiko-App-Version': version,
        'X-Radiko-Device': device,
        'X-Radiko-User': user_id,
        },
        validateStatus: () => true,
    });

    if (auth1Res.status !== 200) {
        throw new Error(`❌ [Error] Auth1 실패: ${auth1Res.status}`);
    }

    const token = auth1Res.headers['x-radiko-authtoken'];
    const offset = parseInt(auth1Res.headers['x-radiko-keyoffset']);
    const length = parseInt(auth1Res.headers['x-radiko-keylength']);

    const decodedKey = Buffer.from(auth_key, 'base64');
    const partialKey = Buffer.from(decodedKey.slice(offset, offset + length)).toString('base64');

    const auth2Res = await axios.get('https://radiko.jp/v2/api/auth2', {
        headers: {
        'X-Radiko-App': app,
        'X-Radiko-App-Version': version,
        'X-Radiko-AuthToken': token,
        'X-Radiko-Connection': 'wifi',
        'X-Radiko-Device': device,
        'X-Radiko-User': user_id,
        'X-Radiko-Location': coordinate,
        'X-Radiko-PartialKey': partialKey,
        },
        validateStatus: () => true,
    });

    if (auth2Res.status !== 200) {
        throw new Error(`❌ [Error] Auth2 실패: ${auth2Res.status}`);
    }
    // console.log('✅ 인증 완료');

    return token;
}

function getGPS(areaId) {
    try {
        const filePath = path.join(process.cwd(), 'public/assets/json/area.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const coordinatesList = JSON.parse(raw);

        let latitude = coordinatesList[areaId]?.latitude || 0;
        let longitude = coordinatesList[areaId]?.longitude || 0;

        latitude += (Math.random() / 40) * (Math.random() > 0.5 ? 1 : -1);
        longitude += (Math.random() / 40) * (Math.random() > 0.5 ? 1 : -1);

        return `${latitude.toFixed(6)},${longitude.toFixed(6)},gps`;
    } catch (e) {
        console.error(`❌ [Error] Getting GPS data for area_id ${areaId}:`, e);
        return '';
    }
}
