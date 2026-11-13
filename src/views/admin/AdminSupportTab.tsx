import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketStatus, SupportTicket } from '../../types';
import {
  MessageSquare,
  Search,
  Send,
  Lock,
  Unlock,
  Radio,
  Trash2,
  Paperclip,
  FileText,
  ZoomIn,
  X,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  MoreVertical,
} from 'lucide-react';
import { SupportAttachment } from '../../components/SupportAttachment';
import { uploadSupportAttachment } from '../../lib/supabase';

export const AdminSupportTab: React.FC = () => {
  const {
    supportTickets,
    sendAdminReply,
    addSupportSystemNotification,
    updateTicketStatus,
    closeSupportSession,
    reopenSupportSession,
    deleteSupportTicket,
    editSupportMessage,
    deleteSupportMessageForEveryone,
    activeSupportUsers,
  } = useApp();

  const [chatStatusFilter, setChatStatusFilter] = useState<'open' | 'closed'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(() => {
    return supportTickets[0]?.id || '';
  });
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [replyText, setReplyText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [adminAttachment, setAdminAttachment] = useState<{
    url: string;
    previewUrl?: string;
    name: string;
    type: 'image' | 'file';
  } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // WhatsApp-style: Chronological order (most recent message activity at the top)
  const sortedTickets = [...supportTickets].sort((a, b) => {
    const timeA = new Date(a.lastMessageTime || 0).getTime();
    const timeB = new Date(b.lastMessageTime || 0).getTime();
    return timeB - timeA;
  });

  const openTicketsCount = sortedTickets.filter((t) => !t.isSessionClosed && t.status !== 'closed').length;
  const closedTicketsCount = sortedTickets.filter((t) => t.isSessionClosed || t.status === 'closed').length;

  const statusFilteredTickets = sortedTickets.filter((t) => {
    const isClosed = t.isSessionClosed || t.status === 'closed';
    return chatStatusFilter === 'closed' ? isClosed : !isClosed;
  });

  // Selected ticket fallback with stable anchor
  const selectedTicket = statusFilteredTickets.find((t) => t.id === selectedTicketId) || statusFilteredTickets[0] || sortedTickets[0];

  // Auto-anchor selectedTicketId on laptop/desktop so conversation is never detached
  useEffect(() => {
    if (statusFilteredTickets.length > 0) {
      if (!selectedTicketId || !statusFilteredTickets.some((t) => t.id === selectedTicketId)) {
        setSelectedTicketId(statusFilteredTickets[0].id);
      }
    }
  }, [statusFilteredTickets, selectedTicketId]);

  // Auto-scroll to bottom whenever the conversation is opened or new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicketId, selectedTicket?.messages?.length]);

  const filteredTickets = statusFilteredTickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.userName.toLowerCase().includes(q) ||
      t.userEmail.toLowerCase().includes(q) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(q))
    );
  });

  const handleAdminFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!isImage && !allowedTypes.includes(file.type)) {
      window.alert('Please choose an image, PDF, DOC, or DOCX file.');
      e.target.value = '';
      return;
    }

    try {
      if (!selectedTicket) throw new Error('Select a support conversation before attaching a file.');
      const storageReference = await uploadSupportAttachment(file, selectedTicket.id);
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

      setAdminAttachment((previous) => {
        if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
        return {
          url: storageReference,
          previewUrl,
          name: file.name,
          type: isImage ? 'image' : 'file',
        };
      });
    } catch (err) {
      console.error('Admin support attachment upload failed:', err);
      window.alert(err instanceof Error ? err.message : 'Unable to upload attachment. Please try again.');
    }
    e.target.value = '';
  };

  const handleSendReply = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    const activeTarget = selectedTicket || sortedTickets.find((t) => t.id === selectedTicketId) || sortedTickets[0];
    if ((!replyText.trim() && !adminAttachment) || !activeTarget) return;

    const textToSend = replyText.trim();
    const attachmentToSend = adminAttachment
      ? {
          url: adminAttachment.url,
          name: adminAttachment.name,
          type: adminAttachment.type,
        }
      : undefined;

    setReplyText('');
    if (adminAttachment?.previewUrl) URL.revokeObjectURL(adminAttachment.previewUrl);
    setAdminAttachment(null);

    sendAdminReply(activeTarget.id, textToSend, attachmentToSend);
  };

  const postSystemNotification = (text: string) => {
    const activeTarget = selectedTicket || sortedTickets.find((t) => t.id === selectedTicketId) || sortedTickets[0];
    if (!activeTarget || activeTarget.isSessionClosed || activeTarget.status === 'closed') return;
    addSupportSystemNotification(activeTarget.id, text);
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
    <div className="space-y-4">
      {/* WhatsApp-Style Clean Header (Filter tabs permanently removed per requirement 2) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span>Support Inbox (Live 2-Way Chat Desk)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time chronological messaging. Conversations automatically jump to top upon new activity.
          </p>
        </div>

        {/* Live sync indicator without status filter pills */}
        <div className="flex items-center gap-2.5 bg-[#121622] px-3.5 py-2 rounded-xl border border-[#21293c] text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">
            Active Conversations: <strong className="text-white font-mono">{supportTickets.length}</strong>
          </span>
          {supportTickets.reduce((acc, t) => acc + (t.unreadAdminCount || 0), 0) > 0 && (
            <span className="bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px] animate-bounce">
              {supportTickets.reduce((acc, t) => acc + (t.unreadAdminCount || 0), 0)} new
            </span>
          )}
        </div>
      </div>

      {/* Main Dual-Pane Chat Layout (Responsive for Mobile & Desktop) */}
      <div className="bg-[#10141f] border border-[#20283c] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-175px)] min-h-[520px] max-h-[820px]">
        {/* Left Inbox List (5 cols on desktop, full width on mobile when not inside a chat) */}
        <div
          className={`md:col-span-5 border-r border-[#1e2538] flex flex-col bg-[#121623] h-full ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Open vs Closed Tabs */}
          <div className="p-2 border-b border-[#1f273a] grid grid-cols-2 gap-1.5 bg-[#0e121a]">
            <button
              type="button"
              onClick={() => setChatStatusFilter('open')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                chatStatusFilter === 'open'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#161c2b]'
              }`}
            >
              <span>Open Chats</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                chatStatusFilter === 'open' ? 'bg-black text-amber-300 font-extrabold' : 'bg-[#1e2538] text-slate-300'
              }`}>
                {openTicketsCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setChatStatusFilter('closed')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                chatStatusFilter === 'closed'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#161c2b]'
              }`}
            >
              <span>Closed Chats</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                chatStatusFilter === 'closed' ? 'bg-black text-amber-300 font-extrabold' : 'bg-[#1e2538] text-slate-300'
              }`}>
                {closedTicketsCount}
              </span>
            </button>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-[#1f273a]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations by name, email, text..."
                className="w-full bg-[#161c2b] border border-[#242e44] focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Ticket list sorted chronologically */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1b2234]">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No conversations found matching search.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const isViewing = activeSupportUsers.some((u) => u.userId === ticket.userId);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setMobileView('chat');
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1b2235] border-l-4 border-amber-400'
                        : 'hover:bg-[#161c2b]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-500/30">
                          {ticket.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white capitalize truncate">{ticket.userName}</span>
                        {ticket.unreadAdminCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                        )}
                        {isViewing && (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold animate-pulse shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Live
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {formatMessageTime(ticket.lastMessageTime)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 truncate mt-1.5 pl-9">
                      {ticket.lastMessage || 'Started conversation'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 pl-9">
                      <span className="truncate">{ticket.userEmail}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded capitalize ${
                          ticket.status === 'pending'
                            ? 'bg-rose-500/20 text-rose-400'
                            : ticket.status === 'answered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700/40 text-slate-400'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane (7 cols on desktop, full width on mobile when viewing chat) */}
        <div
          className={`md:col-span-7 flex flex-col bg-[#0e121c] h-full overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedTicket ? (
            <>
              {/* Conversation Header with Mobile Back Button & Session Controls */}
              <div className="bg-[#141926] border-b border-[#1f273a] px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg bg-[#1e2538] hover:bg-[#28324a] text-slate-300"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white capitalize">
                        {selectedTicket.userName}
                      </h3>
                      <span className="text-[11px] font-mono text-amber-400">({selectedTicket.userEmail})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">User ID: {selectedTicket.userId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.isSessionClosed ? (
                    <button
                      onClick={() => reopenSupportSession(selectedTicket.id)}
                      className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reopen user chat session"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Reopen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => closeSupportSession(selectedTicket.id)}
                      className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Close user chat session"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Close</span>
                    </button>
                  )}

                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="bg-[#1c2336] border border-[#2b3650] text-xs text-white rounded-lg px-2 py-1 outline-none font-semibold cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete this chat conversation for ${selectedTicket.userName}?`)) {
                        deleteSupportTicket(selectedTicket.id);
                        setMobileView('list');
                      }
                    }}
                    className="p-1.5 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                    title="Permanently delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active User Live Presence */}
              {activeSupportUsers.some((u) => u.userId === selectedTicket.userId) && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1.5 flex items-center gap-2 text-xs text-emerald-400 shrink-0">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    🟢 {selectedTicket.userName} is actively in Live Support right now
                  </span>
                </div>
              )}

              {/* Chat Stream with Smooth Scroll, Edit/Delete Support, & Full Message History */}
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain select-text"
              >
                {selectedTicket.messages.map((msg) => {
                  if (msg.isVisitEvent) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center py-1">
                        <div className="inline-flex max-w-[95%] flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-center text-[10px] font-medium text-sky-200">
                          <Radio className="w-3 h-3 shrink-0 text-sky-400" />
                          <span>{msg.senderName} entered Support</span>
                          <span className="font-mono text-sky-300/70">{new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  }

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

                  const isFromAdmin = msg.sender === 'admin';
                  const isEditingThis = editingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isFromAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span className="font-mono">{formatMessageTime(msg.timestamp)}</span>
                        {msg.isEdited && <span className="text-[9px] text-amber-400 font-medium">(edited)</span>}
                      </div>

                      <div className="flex items-center gap-1.5 max-w-[90%]">
                        {/* Action buttons on left for admin messages */}
                        {isFromAdmin && !msg.isDeleted && !isEditingThis && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditingText(msg.text);
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
                                  deleteSupportMessageForEveryone(selectedTicket.id, msg.id);
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
                            isFromAdmin
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
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-black/30 border border-black/40 rounded-lg px-2.5 py-1 text-xs text-black font-semibold outline-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-[10px] bg-black/20 hover:bg-black/30 text-black font-bold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    editSupportMessage(selectedTicket.id, msg.id, editingText);
                                    setEditingMessageId(null);
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
                                <SupportAttachment
                                  reference={msg.attachmentUrl}
                                  name={msg.attachmentName}
                                  type={msg.attachmentType}
                                  onPreview={setZoomImage}
                                />
                              )}
                              {msg.text && <div>{msg.text}</div>}
                            </>
                          )}
                        </div>

                        {/* Action buttons on right for user messages (admin delete for everyone) */}
                        {!isFromAdmin && !msg.isDeleted && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Delete this user message for everyone?')) {
                                  deleteSupportMessageForEveryone(selectedTicket.id, msg.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete message for everyone"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Session Management Bar matching user prompt: "niche close season lekha thakbe" */}
              <div className="bg-[#0f131d] border-t border-[#1e2538] px-4 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedTicket.isSessionClosed ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                  <span className="text-slate-300 font-semibold text-[11px]">
                    Status: {selectedTicket.isSessionClosed ? 'Session Closed' : 'Live Active Session'}
                  </span>
                </div>

                {selectedTicket.isSessionClosed ? (
                  <button
                    type="button"
                    onClick={() => reopenSupportSession(selectedTicket.id)}
                    className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Session</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Close this support session for ${selectedTicket.userName}? It will move to Closed Chats and archive to the user's history.`)) {
                        closeSupportSession(selectedTicket.id);
                      }
                    }}
                    className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 px-3.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-500/10"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Close Session</span>
                  </button>
                )}
              </div>

              {/* Bottom Area: Read-Only when Closed per user requirement; Reply form only when Open */}
              {selectedTicket.isSessionClosed || selectedTicket.status === 'closed' ? (
                <div className="bg-[#121623] border-t border-[#1f273a] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">This session is closed (Archived in Closed Chats)</div>
                      <div className="text-[11px] text-slate-400">
                        Read-only history. Neither user nor admin can send new messages in a closed session.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => reopenSupportSession(selectedTicket.id)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Session</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Shared system status notifications: click to post directly into both chat feeds. */}
                  <div className="bg-[#121622] border-t border-[#1e2538] px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] shrink-0">
                    <span className="text-slate-400 shrink-0 font-medium">Templates:</span>
                    <button
                      type="button"
                      onClick={() => postSystemNotification('Deposit Confirmed')}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 whitespace-nowrap cursor-pointer"
                    >
                      Deposit Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => postSystemNotification('Mentor Commission Paid Successfully')}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 whitespace-nowrap cursor-pointer"
                    >
                      Mentor Commission Paid Successfully
                    </button>
                    <button
                      type="button"
                      onClick={() => postSystemNotification('Withdrawal Successful')}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 whitespace-nowrap cursor-pointer"
                    >
                      Withdrawal Successful
                    </button>
                  </div>

                  {/* Reply Input Bar with Auto-Focus and Multi-device support */}
                  <form
                    onSubmit={handleSendReply}
                    className="bg-[#141926] border-t border-[#1f273a] p-3 flex flex-col gap-2 shrink-0"
                  >
                    {adminAttachment && (
                      <div className="flex items-center gap-2.5 bg-[#0b0e15] p-2 rounded-xl border border-[#232c40] w-fit max-w-full">
                        {adminAttachment.type === 'image' ? (
                          <img
                            src={adminAttachment.previewUrl || adminAttachment.url}
                            alt="preview"
                            className="w-10 h-10 rounded-lg object-cover border border-[#2b354d]"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-amber-400 p-1.5 bg-amber-400/10 rounded-lg" />
                        )}
                        <div className="min-w-0 pr-2">
                          <div className="text-[11px] font-semibold text-slate-200 truncate max-w-[200px]">
                            {adminAttachment.name}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono">Ready to send</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (adminAttachment.previewUrl) URL.revokeObjectURL(adminAttachment.previewUrl);
                            setAdminAttachment(null);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        ref={adminFileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleAdminFileSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => adminFileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-[#0b0e15] hover:bg-[#1a2130] text-slate-300 hover:text-amber-400 border border-[#21293c] transition-colors cursor-pointer shrink-0"
                        title="Attach image or document"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                        placeholder={`Reply directly to ${selectedTicket.userName}...`}
                        className="flex-1 bg-[#0b0e15] border border-[#21293c] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                      />

                      <button
                        type="button"
                        onClick={(e) => handleSendReply(e)}
                        disabled={!replyText.trim() && !adminAttachment}
                        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span className="text-xs font-bold hidden sm:inline">Reply</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Select a conversation to view and reply.
            </div>
          )}
        </div>
      </div>

      {/* Admin Image Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
