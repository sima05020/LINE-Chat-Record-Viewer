import { useRef, useState } from 'react';
import ChatMessage from './components/ChatMessage';

// --- 追加: ユーザー一覧抽出 ---
function extractUsers(chatData) {
    const users = new Set();
    chatData.forEach(day => {
        day.messages.forEach(msg => users.add(msg.user));
    });
    return Array.from(users);
}

// --- 追加: txtパーサー ---
function parseLineChat(text) {
    // 2形式に対応
    const lines = text.split(/\r?\n/);
    const result = [];
    let currentDate = '';
    let dayObj = null;

    // フォーマット1: 2025.04.18 金曜日
    const dateLine1 = /^(\d{4})\.(\d{2})\.(\d{2})/;
    // フォーマット2: 2021/11/26(金)
    const dateLine2 = /^(\d{4})\/(\d{1,2})\/(\d{1,2})/;
    // メッセージ: 07:10 sima ありがと
    const msgLine1 = /^(\d{1,2}:\d{2})\s+(\S+)\s+(.+)$/;
    // メッセージ: 2:19 Reina 通話時間 1:30:01
    // ↑上と同じでOK

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        // 日付行判定
        let m1 = dateLine1.exec(line);
        let m2 = dateLine2.exec(line);
        if (m1) {
            currentDate = `${m1[1]}-${m1[2]}-${m1[3]}`;
            dayObj = { date: currentDate, messages: [] };
            result.push(dayObj);
            continue;
        }
        if (m2) {
            currentDate = `${m2[1]}-${String(m2[2]).padStart(2, '0')}-${String(m2[3]).padStart(2, '0')}`;
            dayObj = { date: currentDate, messages: [] };
            result.push(dayObj);
            continue;
        }
        // メッセージ行判定
        const mMsg = msgLine1.exec(line);
        if (mMsg && dayObj) {
            dayObj.messages.push({
                time: mMsg[1],
                user: mMsg[2],
                text: mMsg[3],
            });
        }
    }
    return result;
}

function App() {
    const [chatData, setChatData] = useState([]);
    const [myName, setMyName] = useState('Reina'); // ← useStateで管理
    const [keyword, setKeyword] = useState('');
    const [inputKeyword, setInputKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const chatRef = useRef(null);
    const messageRefs = useRef({});

    // --- 追加: ユーザー一覧 ---
    const users = extractUsers(chatData);

    // --- 追加: ファイル選択処理 ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const parsed = parseLineChat(text);
            setChatData(parsed);
            // 先頭ユーザーをデフォルト選択
            const userList = extractUsers(parsed);
            if (userList.length > 0) setMyName(userList[0]);
            setTimeout(() => {
                chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        };
        reader.readAsText(file, 'utf-8');
    };

    // 全体表示（フィルタしない）
    const visibleData = chatData.filter(day =>
        !dateFilter || day.date.includes(dateFilter)
    );

    // 検索語に一致するメッセージのみリストアップ
    const searchResults = [];
    visibleData.forEach((day, i) => {
        day.messages.forEach((msg, j) => {
            if (keyword && msg.text.includes(keyword)) {
                searchResults.push({
                    ...msg,
                    date: day.date,
                    key: `${i}-${j}`,
                });
            }
        });
    });

    // ハイライト判定
    const isHighlighted = (msg) =>
        keyword && msg.text.includes(keyword);

    // スクロール処理
    const scrollToMessage = (key) => {
        const el = messageRefs.current[key];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring', 'ring-yellow-400');
            setTimeout(() => {
                el.classList.remove('ring', 'ring-yellow-400');
            }, 1500);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            <header className="p-4 bg-green-600 text-white">
                <h1 className="text-xl font-bold">LINEトークビューア</h1>
            </header>

            {/* ファイル選択UI */}
            <div className="p-2 bg-white flex gap-2 items-center">
                <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="border p-1 rounded"
                />
                <span className="text-sm text-gray-500">txtファイルを選択してください</span>
                {/* --- 追加: ユーザー選択 --- */}
                {users.length > 0 && (
                    <select
                        value={myName}
                        onChange={e => setMyName(e.target.value)}
                        className="border p-1 rounded ml-4"
                    >
                        {users.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* 検索・日付フィルタUI */}
            <div className="p-2 bg-white flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="キーワード検索"
                    className="border p-1 rounded"
                    value={inputKeyword}
                    onChange={e => setInputKeyword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setKeyword(inputKeyword);
                        }
                    }}
                />
                <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => setKeyword(inputKeyword)}
                >
                    検索
                </button>
                <input
                    type="date"
                    className="border p-1 rounded"
                    onChange={e => setDateFilter(e.target.value)}
                />
            </div>

            {/* 検索結果・チャット表示 */}
            {keyword && searchResults.length > 0 && (
                <div className="bg-white p-2 border-b max-h-40 overflow-y-auto">
                    <h2 className="text-sm font-bold mb-1 text-gray-600">検索結果</h2>
                    <ul className="text-sm space-y-1">
                        {searchResults.map((msg, i) => (
                            <li
                                key={i}
                                className="hover:underline text-blue-700 cursor-pointer"
                                onClick={() => scrollToMessage(msg.key)}
                            >
                                [{msg.date} {msg.time}] {msg.user}「{msg.text}」
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
                {visibleData.map((day, i) => (
                    <div key={i}>
                        <div className="text-center text-gray-500 text-sm mb-2">{day.date}</div>
                        {day.messages.map((msg, j) => {
                            const key = `${i}-${j}`;
                            return (
                                <div
                                    key={key}
                                    ref={(el) => (messageRefs.current[key] = el)}
                                    className={isHighlighted(msg) ? 'bg-yellow-100 rounded' : ''}
                                >
                                    <ChatMessage message={msg} myName={myName} />
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={chatRef} />
            </div>
        </div>
    );
}

export default App;
