import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SupportMessage, SupportTicket } from '../types';
import {
  X,
  Send,
  Headphones,
  ShieldCheck,
  Paperclip,
  FileText,
  ZoomIn,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

export const SupportModal: React.FC = () => {
  const {
    isSupportOpen,
    setIsSupportOpen,
    currentUser,
    supportTickets,
    sendUserMessage,
    markUserChatAsRead,
    setUserViewingSupport,
    startNewSupportChat,
    editSupportMessage,
    deleteSupportMessageForEveryone,
  } = useApp();

  const [activeView, setActiveView] = useState<'home' | 'chat'>('home');
  const [selectedSessionTicketId, setSelectedSessionTicketId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<{
    url: string;
    name: string;
    type: 'image' | 'file';
  } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // All tickets belonging to current user
  const userTickets = supportTickets.filter((t) => t.userId === currentUser.id);

  // Active open ticket if any
  const openTicket = userTickets.find((t) => !t.isSessionClosed && t.status !== 'closed');

  // Closed history tickets
  const closedTickets = userTickets.filter((t) => t.isSessionClosed || t.status === 'closed');

  // Active ticket being viewed in chat
  const viewingTicket = selectedSessionTicketId
    ? userTickets.find((t) => t.id === selectedSessionTicketId) || openTicket || closedTickets[0]
    : openTicket || closedTickets[0];

  const isCurrentSessionClosed = viewingTicket?.isSessionClosed || viewingTicket?.status === 'closed';

  useEffect(() => {
    if (isSupportOpen) {
      markUserChatAsRead();
      setUserViewingSupport(currentUser.id, true);
      return () => {
        setUserViewingSupport(currentUser.id, false);
      };
    }
  }, [isSupportOpen, currentUser.id]);

  useEffect(() => {
    if (activeView === 'chat' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeView, viewingTicket?.messages?.length]);

  if (!isSupportOpen) return null;

  const handleStartLiveChat = () => {
    if (openTicket && !isCurrentSessionClosed) {
      setSelectedSessionTicketId(openTicket.id);
      setActiveView('chat');
    } else {
      startNewSupportChat(currentUser.id);
      setTimeout(() => {
        const latest = supportTickets.find(
          (t) => t.userId === currentUser.id && !t.isSessionClosed && t.status !== 'closed'
        );
        if (latest) {
          setSelectedSessionTicketId(latest.id);
        }
        setActiveView('chat');
      }, 80);
    }
  };

  const handleOpenClosedSession = (ticketId: string) => {
    setSelectedSessionTicketId(ticketId);
    setActiveView('chat');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    try {
      if (isImage) {
        const compressed = await compressImageFile(file, {
          maxWidth: 960,
          maxHeight: 960,
          quality: 0.8,
        });
        setSelectedAttachment({
          url: compressed,
          name: file.name,
          type: 'image',
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedAttachment({
            url: reader.result as string,
            name: file.name,
            type: 'file',
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Error reading chat attachment:', err);
    }

    e.target.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedAttachment) return;
    if (isCurrentSessionClosed) {
      // If current session is closed, start a new chat automatically
      startNewSupportChat(currentUser.id);
      setTimeout(() => {
        sendUserMessage(
          inputMessage.trim(),
          selectedAttachment
            ? {
                url: selectedAttachment.url,
                name: selectedAttachment.name,
                type: selectedAttachment.type,
              }
            : undefined
        );
      }, 50);
    } else {
      sendUserMessage(
        inputMessage.trim(),
        selectedAttachment
          ? {
              url: selectedAttachment.url,
              name: selectedAttachment.name,
              type: selectedAttachment.type,
            }
          : undefined
      );
    }

    setInputMessage('');
    setSelectedAttachment(null);
  };

  const formatSessionDate = (timeStr?: string) => {
    try {
      if (!timeStr) return 'Recent';
      const d = new Date(timeStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return 'Recent';
    }
  };

  const formatMessageTime = (timeStr: string) => {
    try {
      if (!timeStr) return '';
      if (timeStr.includes('T')) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return timeStr.slice(11, 16) || timeStr;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0b0e14] border border-[#1f273a] rounded-3xl w-full max-w-md h-[680px] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* TOP STATUS BAR matching screenshot: CPT Markets (left) | UID: 827592 (center/right) | ✕ */}
        <div className="bg-[#0e121b] border-b border-[#1b2234] px-5 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">CPT</span>
            <span className="font-extrabold text-amber-400 text-sm tracking-tight">Markets</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-300 font-semibold">
              UID: {currentUser.uid}
            </span>
            <button
              onClick={() => setIsSupportOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-[#1a2133] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: SUPPORT HOME / CHAT HISTORY (Matching image_c87678f6.png) */}
        {activeView === 'home' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title: Customer Support */}
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Customer <span className="text-amber-400">Support</span>
              </h2>
            </div>

            {/* Main Action Card matching image_c87678f6.png */}
            <div className="bg-[#121622] border border-[#212a3e] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center shrink-0">
                  <span className="font-extrabold text-amber-400 text-xs tracking-wider">CPT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm tracking-wide">
                      CPT MARKETS
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-[#1a2133] px-2 py-0.5 rounded-full">
                      New
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    Start a new conversation with supp...
                  </p>
                </div>
              </div>

              {/* Big Yellow Button: + Start Live Chat */}
              <button
                type="button"
                onClick={handleStartLiveChat}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-black text-amber-400 flex items-center justify-center font-bold text-base leading-none">
                  +
                </div>
                <span>Start Live Chat</span>
              </button>
            </div>

            {/* Section: CHAT HISTORY matching screenshot */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Chat History
              </div>

              {closedTickets.length === 0 && !openTicket ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-[#121622] rounded-2xl border border-[#1e263a]">
                  No previous chat history found. Tap above to start your first live session.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* If there's an ongoing active session, show it at the top */}
                  {openTicket && (
                    <div
                      onClick={() => {
                        setSelectedSessionTicketId(openTicket.id);
                        setActiveView('chat');
                      }}
                      className="bg-[#161c2b] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 cursor-pointer transition-all shadow-md group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {openTicket.lastMessage || 'Active live support session...'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                            <span className="font-mono">
                              Session #{openTicket.sessionNumber || '245'}
                            </span>
                            <span>•</span>
                            <span>{formatSessionDate(openTicket.lastMessageTime)}</span>
                          </div>
                        </div>

                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Active</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Closed Past Sessions matching image_c87678f6.png */}
                  {closedTickets.map((ticket, idx) => {
                    const sessionNum = ticket.sessionNumber || 243 - idx * 3;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleOpenClosedSession(ticket.id)}
                        className="bg-[#121622] border border-[#1f273a] hover:border-[#2f3b56] hover:bg-[#161c2a] rounded-2xl p-4 cursor-pointer transition-all shadow-sm group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                              {ticket.lastMessage || 'Hello! Sir, Welcome to our 24/7 Live Customer Support.'}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                              <span>Session #{sessionNum}</span>
                              <span>•</span>
                              <span>{formatSessionDate(ticket.lastMessageTime)}</span>
                            </div>
                          </div>

                          <span className="bg-[#1e2638] text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0">
                            Closed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE / CLOSED CHAT ROOM */
          <div className="flex-1 flex flex-col min-h-0 bg-[#0d1017]">
            {/* Conversation Header */}
            <div className="bg-[#121622] border-b border-[#1f273a] px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="p-1.5 rounded-lg bg-[#182030] text-slate-300 hover:text-white hover:bg-[#202b42] transition-colors cursor-pointer"
                  title="Back to support home"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Live Customer Support</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isCurrentSessionClosed
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isCurrentSessionClosed ? 'Closed' : 'Live Desk'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Session #{viewingTicket?.sessionNumber || '245'} • 24/7 UK Operator
                  </div>
                </div>
              </div>

              {isCurrentSessionClosed && (
                <button
                  type="button"
                  onClick={handleStartLiveChat}
                  className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  + New Chat
                </button>
              )}
            </div>

            {/* Closed Session Advisory Banner */}
            {isCurrentSessionClosed && (
              <div className="bg-slate-800/60 border-b border-slate-700/50 px-4 py-2 text-[11px] text-slate-300 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>This support session has been closed by the operator.</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartLiveChat}
                  className="text-amber-400 hover:text-amber-300 font-bold underline text-[11px] cursor-pointer ml-2"
                >
                  Start New Live Chat
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain select-text"
            >
              {(!viewingTicket || viewingTicket.messages.every((msg) => msg.isVisitEvent)) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
                  <Headphones className="w-8 h-8 text-amber-400" />
                  <p className="text-xs">
                    No messages yet. Send a message to contact the support team.
                  </p>
                </div>
              ) : (
                viewingTicket.messages.filter((msg) => !msg.isVisitEvent).map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center py-1">
                        <div className="inline-flex max-w-[90%] items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-[11px] font-semibold leading-relaxed text-emerald-300 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{msg.text}</span>
                          <span className="text-[9px] font-mono text-emerald-400/70 shrink-0">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  const isFromMe = msg.sender === 'user';
                  const isEditingThis = editingMsgId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isFromMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-300">
                          {isFromMe ? 'You' : msg.senderName}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{formatMessageTime(msg.timestamp)}</span>
                        {msg.isEdited && <span className="text-[9px] text-amber-400 font-medium">(edited)</span>}
                      </div>

                      <div className="flex items-center gap-1.5 max-w-[88%]">
                        {/* Edit / Delete actions for user's own messages */}
                        {isFromMe && !msg.isDeleted && !isEditingThis && !isCurrentSessionClosed && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditingMsgText(msg.text);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                              title="Edit message"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Delete this message for everyone?')) {
                                  deleteSupportMessageForEveryone(viewingTicket.id, msg.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete for everyone"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm flex-1 ${
                            isFromMe
                              ? msg.isDeleted
                                ? 'bg-amber-500/10 text-amber-300/60 border border-amber-500/20 italic rounded-tr-sm'
                                : 'bg-amber-400 text-black font-medium rounded-tr-sm'
                              : msg.isDeleted
                              ? 'bg-[#181d2a] text-slate-500 italic border border-[#212739] rounded-tl-sm'
                              : 'bg-[#1b2234] text-slate-100 border border-[#28334c] rounded-tl-sm'
                          }`}
                        >
                          {msg.isDeleted ? (
                            <span className="flex items-center gap-1.5">
                              <span>🚫</span>
                              <span>This message was deleted</span>
                            </span>
                          ) : isEditingThis ? (
                            <div className="space-y-2 py-1">
                              <input
                                type="text"
                                value={editingMsgText}
                                onChange={(e) => setEditingMsgText(e.target.value)}
                                className="w-full bg-black/30 border border-black/40 rounded-lg px-2.5 py-1 text-xs text-black font-semibold outline-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="text-[10px] bg-black/20 hover:bg-black/30 text-black font-bold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    editSupportMessage(viewingTicket.id, msg.id, editingMsgText);
                                    setEditingMsgId(null);
                                  }}
                                  className="text-[10px] bg-black text-amber-300 font-extrabold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.attachmentUrl && (
                                <div className="mb-2">
                                  {msg.attachmentType === 'image' ? (
                                    <div className="relative group/img">
                                      <img
                                        src={msg.attachmentUrl}
                                        alt={msg.attachmentName || 'Attachment'}
                                        onClick={() => setZoomImage(msg.attachmentUrl || null)}
                                        className="rounded-xl max-h-52 max-w-full object-contain cursor-pointer hover:opacity-95 transition-opacity border border-black/20 bg-black/30"
                                      />
                                      <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-black/15 text-xs">
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate font-semibold">{msg.attachmentName || 'Document'}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {msg.text && <div>{msg.text}</div>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar: Read-Only when Closed with "New Chat" button per user requirement */}
            {isCurrentSessionClosed ? (
              <div className="bg-[#121623] border-t border-[#1f273a] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">This session is closed (Read-Only)</div>
                    <div className="text-[11px] text-slate-400">You cannot send new messages in a closed session.</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartLiveChat}
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 font-black" />
                  <span>New Chat</span>
                </button>
              </div>
            ) : (
              /* User Input Bar for Active Session */
              <form
                onSubmit={handleSend}
                className="bg-[#121623] border-t border-[#1f273a] p-3 flex flex-col gap-2 shrink-0"
              >
                {selectedAttachment && (
                  <div className="flex items-center gap-2.5 bg-[#0b0e15] p-2 rounded-xl border border-[#232c40] w-fit max-w-full">
                    {selectedAttachment.type === 'image' ? (
                      <img
                        src={selectedAttachment.url}
                        alt="preview"
                        className="w-10 h-10 rounded-lg object-cover border border-[#2b354d]"
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-amber-400 p-1.5 bg-amber-400/10 rounded-lg" />
                    )}
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-semibold text-slate-200 truncate max-w-[200px]">
                        {selectedAttachment.name}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Ready to upload</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAttachment(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-[#0b0e15] hover:bg-[#1a2130] text-slate-300 hover:text-amber-400 border border-[#21293c] transition-colors cursor-pointer shrink-0"
                    title="Attach image or deposit slip"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message to support..."
                    className="flex-1 bg-[#0b0e15] border border-[#21293c] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() && !selectedAttachment}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-xs font-bold hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Fullscreen Image Zoom Modal */}
        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={zoomImage}
                alt="Zoomed Attachment"
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/20 shadow-2xl"
              />
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
