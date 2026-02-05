import { useState } from 'react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

const Messages = () => {
    const [activeChat, setActiveChat] = useState(null);

    const chats = [
        {
            id: 1,
            username: "Sarah Jenkins",
            lastMessage: "See you at the concert!",
            time: "10:30 AM",
            messages: [
                { text: "Hey! Are you going to the M83 concert?", isMe: false, time: "10:28 AM" },
                { text: "Yes! Can't wait.", isMe: true, time: "10:29 AM" },
                { text: "See you at the concert!", isMe: false, time: "10:30 AM" }
            ]
        },
        {
            id: 2,
            username: "Producer Mike",
            lastMessage: "Sent you the new stems.",
            time: "Yesterday",
            messages: [
                { text: "Yo, check your email.", isMe: false, time: "Yesterday" },
                { text: "Sent you the new stems.", isMe: false, time: "Yesterday" }
            ]
        },
        {
            id: 3,
            username: "Design Team",
            lastMessage: "Meeting at 3?",
            time: "Mon",
            messages: [
                { text: "Meeting at 3?", isMe: false, time: "Mon" }
            ]
        }
    ];

    return (
        <div className="page-container" style={{ display: 'flex', height: '100%' }}>
            <ChatList
                chats={chats}
                activeChatId={activeChat?.id}
                onSelectChat={setActiveChat}
            />
            <ChatWindow activeChat={activeChat} />
        </div>
    );
};

export default Messages;
