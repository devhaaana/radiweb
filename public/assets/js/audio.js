const audio = document.getElementById('player');
const audioVolume = document.getElementById('volume-control');
const volumeIcon = document.getElementById('volume-icon');

document.addEventListener('DOMContentLoaded', async () => {
    if (audioVolume) {
        audioVolume.addEventListener('input', updateVolumeSlider);
        updateVolumeSlider();
    }
    if (volumeIcon) {
        volumeIcon.addEventListener('click', () => {
            audio.muted = !audio.muted;
            updateVolumeSlider();
        });
    }
});

function updateVolumeSlider() {
    const volume = audioVolume.value / 10;
    
    audioVolume.style.setProperty("--value", volume * 100);
    audio.volume = volume;

    if (volumeIcon) {
        if (audio.muted || volume === 0) {
            volumeIcon.className = 'bi bi-volume-mute';
            volumeIcon.classList.add('muted');
        } else {
            if (volume <= 0.3) {
                volumeIcon.className = 'bi bi-volume-down';
            } else if (volume <= 0.6) {
                volumeIcon.className = 'bi bi-volume-up';
            } else {
                volumeIcon.className = 'bi bi-volume-up-fill';
            }
            volumeIcon.classList.remove('muted');
        }
    }
}
