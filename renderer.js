/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Time-Loop DJ Rewind</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root { --v-pink: #ff71ce; --v-blue: #01cdfe; --v-dark: #050510; }
        body { background: var(--v-dark); color: white; font-family: sans-serif; overflow: hidden; }
        .crt { position: fixed; inset: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; pointer-events: none; z-index: 100; }
        .card { border: 1px solid rgba(1, 205, 254, 0.3); background: rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s; }
        .card:hover, .card.selected { border-color: var(--v-pink); background: rgba(255, 113, 206, 0.1); }
    </style>
</head>
<body class="flex items-center justify-center h-screen">
    <div class="crt"></div>

    <!-- 노래 선택 화면 -->
    <div id="lobby" class="text-center z-10 w-full max-w-2xl">
        <h1 class="text-5xl font-black italic mb-8 tracking-tighter shadow-pink-500">SONG SELECT</h1>
        <div id="list" class="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto mb-8 p-4">
            <p class="opacity-50">Scanning songs folder...</p>
        </div>
        <button id="startBtn" disabled class="bg-white text-black px-12 py-3 font-bold disabled:opacity-30">START ENGINE</button>
        <p class="text-[10px] mt-4 opacity-40">PLACE .MP3 FILES IN YOUR 'SONGS' FOLDER</p>
    </div>

    <!-- 게임 화면 (초기 숨김) -->
    <div id="game" class="hidden fixed inset-0 z-20 bg-[#050510]">
        <div class="absolute top-10 left-10 text-2xl font-bold" id="ui-info">PHASE 1</div>
        <canvas id="canvas"></canvas>
    </div>

    <script>
        const lobby = document.getElementById('lobby');
        const listContainer = document.getElementById('list');
        const startBtn = document.getElementById('startBtn');
        let selectedSong = null;

        // 곡 목록 불러오기
        async function init() {
            try {
                const songs = await window.electronAPI.getSongList();
                listContainer.innerHTML = '';
                
                if (songs.length === 0) {
                    listContainer.innerHTML = '<p class="text-red-400">곡이 없습니다. songs 폴더에 mp3를 넣어주세요.</p>';
                    return;
                }

                songs.forEach(song => {
                    const div = document.createElement('div');
                    div.className = 'card p-4 rounded text-left';
                    div.innerHTML = `<div class="font-bold">${song.name}</div><div class="text-xs opacity-50">BPM ${song.bpm}</div>`;
                    div.onclick = () => {
                        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                        div.classList.add('selected');
                        selectedSong = song;
                        startBtn.disabled = false;
                    };
                    listContainer.appendChild(div);
                });
            } catch (e) {
                listContainer.innerHTML = 'API 연결 실패 (Fiddle 설정 확인)';
            }
        }

        startBtn.onclick = () => {
            if (!selectedSong) return;
            lobby.classList.add('hidden');
            document.getElementById('game').classList.remove('hidden');
            // 여기서부터 게임 엔진 시작 (animate() 등)
            alert(selectedSong.name + " 게임을 시작합니다! (엔진 로드 중)");
        };

        init();
    </script>
</body>
</html>
