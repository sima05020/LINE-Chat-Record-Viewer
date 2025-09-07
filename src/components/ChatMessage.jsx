function ChatMessage({ message, myName }) {
    const isMine = message.user === myName;

    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
            <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow ${isMine ? 'bg-green-300 text-right' : 'bg-white'}`}>
                <div className="font-bold text-xs text-gray-600">{message.user}</div>
                <div>{message.text}</div>
                <div className="text-[10px] text-gray-400 mt-1">{message.time}</div>
            </div>
        </div>
    );
}

export default ChatMessage;
