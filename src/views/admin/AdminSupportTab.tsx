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
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

export const AdminSupportTab: React.FC = () => {
  const {
    supportTickets,
    sendAdminReply,
    updateTicketStatus,
    closeSupportSession,
    reopenSupportSession,
    deleteSupportTicket,
    activeSupportUsers,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(() => {
    return supportTickets[0]?.id || '';
  });
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [replyText, setReplyText] = useState('');
  const [adminAttachment, setAdminAttachment] = useState<{
    url: string;
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

  // Selected ticket fallback with stable anchor
  const selectedTicket = sortedTickets.find((t) => t.id === selectedTicketId) || sortedTickets[0];

  // Auto-anchor selectedTicketId on laptop/desktop so conversation is never detached
  useEffect(() => {
    if (sortedTickets.length > 0) {
      if (!selectedTicketId || !sortedTickets.some((t) => t.id === selectedTicketId)) {
        setSelectedTicketId(sortedTickets[0].id);
      }
    }
  }, [sortedTickets, selectedTicketId]);

  // Auto-scroll to bottom whenever the conversation is opened or new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicketId, selectedTicket?.messages?.length]);

  const filteredTickets = sortedTickets.filter((t) => {
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
    try {
      if (isImage) {
        const compressed = await compressImageFile(file, {
          maxWidth: 960,
          maxHeight: 960,
          quality: 0.8,
        });
        setAdminAttachment({
          url: compressed,
          name: file.name,
          type: 'image',
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setAdminAttachment({
            url: reader.result as string,
            name: file.name,
            type: 'file',
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Admin attachment read error:', err);
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
    setAdminAttachment(null);

    sendAdminReply(activeTarget.id, textToSend, attachmentToSend);
  };

  const insertTemplate = (text: string) => {
    setReplyText(text);
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
      <div className="bg-[#10141f] border border-[#20283c] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 grid-rows-1 md:grid-cols-12 h-[660px] min-h-0">
        {/* Left Inbox List (5 cols on desktop, full width on mobile when not inside a chat) */}
        <div
          className={`md:col-span-5 border-r border-[#1e2538] flex flex-col bg-[#121623] h-full min-h-0 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
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
          className={`md:col-span-7 flex flex-col bg-[#0e121c] h-full min-h-0 overflow-hidden ${
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

              {/* Chat Stream with Smooth Scroll & Full Message History */}
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain select-text"
              >
                {selectedTicket.messages.map((msg) => {
                  const isFromAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span className="font-mono">{formatMessageTime(msg.timestamp)}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isFromAdmin
                            ? 'bg-amber-400 text-black font-medium rounded-tr-sm'
                            : 'bg-[#1b2234] text-slate-100 border border-[#28334c] rounded-tl-sm'
                        }`}
                      >
                        {msg.attachmentUrl && (
                          <div className="mb-2">
                            {msg.attachmentType === 'image' ? (
                              <div className="relative group">
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentName || 'Attachment'}
                                  onClick={() => setZoomImage(msg.attachmentUrl || null)}
                                  className="rounded-xl max-h-52 max-w-full object-contain cursor-pointer hover:opacity-95 transition-opacity border border-black/20 bg-black/30"
                                />
                                <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Templates */}
              <div className="bg-[#121622] border-t border-[#1e2538] px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] shrink-0">
                <span className="text-slate-400 shrink-0 font-medium">Templates:</span>
                <button
                  onClick={() =>
                    insertTemplate(
                      'Hello! Our verified treasury deposit address is: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t (USDT TRC-20). Please send the TXID once completed.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-amber-400 px-2 py-1 rounded border border-[#26334d] whitespace-nowrap cursor-pointer"
                >
                  💳 Deposit TRC-20 Address
                </button>
                <button
                  onClick={() =>
                    insertTemplate(
                      'Your withdrawal request has been verified and processed by our finance desk. Thank you for trading with CPT Markets UK.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-slate-300 hover:text-white px-2 py-1 rounded border border-[#26334d] whitespace-nowrap cursor-pointer"
                >
                  ✅ Withdrawal Processed
                </button>
                <button
                  onClick={() =>
                    insertTemplate(
                      'A promotional bonus credit has been approved and added to your trading wallet balance.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-slate-300 hover:text-white px-2 py-1 rounded border border-[#26334d] whitespace-nowrap cursor-pointer"
                >
                  🎁 Bonus Credited
                </button>
              </div>

              {/* Reply Input Bar with Auto-Focus and Multi-device support */}
              <form
                onSubmit={handleSendReply}
                className="relative z-10 bg-[#141926] border-t border-[#1f273a] p-3 flex flex-col gap-2 shrink-0"
              >
                {adminAttachment && (
                  <div className="flex items-center gap-2.5 bg-[#0b0e15] p-2 rounded-xl border border-[#232c40] w-fit max-w-full">
                    {adminAttachment.type === 'image' ? (
                      <img
                        src={adminAttachment.url}
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
                      onClick={() => setAdminAttachment(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex min-w-0 flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    placeholder={`Reply directly to ${selectedTicket.userName}...`}
                    className="w-full min-w-0 flex-1 bg-[#0b0e15] border border-[#21293c] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendReply()}
                    disabled={!replyText.trim() && !adminAttachment}
                    className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-xs font-bold hidden sm:inline">Reply</span>
                  </button>
                </div>
              </form>
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
