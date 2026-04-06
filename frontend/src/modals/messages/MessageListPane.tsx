import React, { useMemo } from 'react';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ClearIcon from '@mui/icons-material/Clear';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ForumIcon from '@mui/icons-material/Forum';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Message, Folder } from './types';
import { relativeTime, senderInitials, avatarColor } from './helpers';

interface Props {
  messages:        Message[];
  search:          string;
  onSearch:        (s: string) => void;
  folder:          Folder;
  selectedId?:     string;
  isMobile:        boolean;
  loading:         boolean;
  unreadCount:     number;
  onMessageClick:  (msg: Message) => void;
  onMarkAllRead:   () => void;
}

interface Thread {
  key:       string;
  latest:    Message;    // neueste Nachricht (für Lesen, Zeit, Sender)
  senders:   string[];   // alle verschiedenen Absender
  count:     number;
  hasUnread: boolean;
}

export const MessageListPane: React.FC<Props> = ({
  messages, search, onSearch,
  folder, selectedId, isMobile, loading,
  unreadCount, onMessageClick, onMarkAllRead,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /**
   * Gruppiert Nachrichten anhand von threadId oder parentId.
   * Nachrichten ohne beide Felder erscheinen als eigene Einzel-"Threads".
   */
  const threads = useMemo<Thread[]>(() => {
    if (!messages.length) return [];

    const map = new Map<string, Message[]>();
    for (const msg of messages) {
      // Bevorzuge threadId, dann parentId als Gruppen-Schlüssel.
      // Nachrichten ohne beide bilden ihren eigenen Eintrag.
      const key = msg.threadId ?? msg.parentId ?? msg.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(msg);
    }

    return Array.from(map.values())
      .map(msgs => {
        const sorted = [...msgs].sort(
          (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
        const uniqueSenders = [...new Set(sorted.map(m => m.sender))];
        return {
          key:      sorted[sorted.length - 1].id,
          latest:   sorted[0],
          senders:  uniqueSenders,
          count:    sorted.length,
          hasUnread: sorted.some(m => !m.isRead),
        };
      })
      .sort((a, b) =>
        new Date(b.latest.sentAt).getTime() - new Date(a.latest.sentAt).getTime()
      );
  }, [messages]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Search + mark-all-read toolbar */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
        <TextField
          size="small" fullWidth placeholder="Suchen…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearch('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Box>

      {/* Mark all read – only in inbox when there are unread messages */}
      {folder === 0 && unreadCount > 0 && (
        <Box sx={{ px: 1.5, pb: 0.75, flexShrink: 0 }}>
          <Tooltip title="Alle als gelesen markieren">
            <Button
              size="small"
              startIcon={<DoneAllIcon fontSize="small" />}
              onClick={onMarkAllRead}
              sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'none', pl: 0.5 }}
            >
              Alle als gelesen markieren
            </Button>
          </Tooltip>
        </Box>
      )}

      <Divider sx={{ flexShrink: 0 }} />

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : threads.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <MailOutlineIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">
              {search
                ? 'Keine Treffer'
                : folder === 0
                  ? 'Keine Nachrichten'
                  : 'Keine gesendeten Nachrichten'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {threads.map((thread, idx) => {
              const { latest: msg, senders, count, hasUnread } = thread;
              const isUnread   = hasUnread && folder === 0;
              const isSelected = msg.id === selectedId && !isMobile;
              const isThread   = count > 1;

              return (
                <React.Fragment key={thread.key}>
                  <ListItemButton
                    data-testid={`msg-${msg.id}`}
                    selected={isSelected}
                    onClick={() => onMessageClick(msg)}
                    sx={{
                      px: 1.5, py: 1.25,
                      borderLeft: isUnread
                        ? `3px solid ${theme.palette.primary.main}`
                        : '3px solid transparent',
                      bgcolor: isUnread
                        ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06)
                        : undefined,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.28 : 0.16),
                        },
                      },
                      '&:hover': {
                        bgcolor: isUnread
                          ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.10)
                          : theme.palette.action.hover,   // ← fix: kein alpha(x,1) → war schwarz in hell-Mode
                      },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      {isThread ? (
                        /* Konversation: gestapelte Avatare */
                        <Badge
                          badgeContent={
                            <Box sx={{
                              display: 'flex', alignItems: 'center', gap: '2px',
                              bgcolor: 'primary.main', color: 'primary.contrastText',
                              borderRadius: 1, px: 0.5, py: 0.1, fontSize: '0.65rem', fontWeight: 700,
                            }}>
                              <ForumIcon sx={{ fontSize: 10 }} />
                              {count}
                            </Box>
                          }
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 12 } }}>
                            {senders.map(s => (
                              <Avatar key={s} sx={{ bgcolor: avatarColor(s) }}>
                                {senderInitials(s)}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Badge>
                      ) : (
                        <Badge
                          color="primary" variant="dot"
                          invisible={!isUnread}
                          overlap="circular"
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: avatarColor(msg.sender) }}>
                            {senderInitials(msg.sender)}
                          </Avatar>
                        </Badge>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                          <Typography
                            variant="body2" noWrap sx={{ flex: 1 }}
                            fontWeight={isUnread ? 700 : 400}
                          >
                            {folder === 0
                              ? (isThread ? senders.join(', ') : msg.sender)
                              : msg.recipients?.map(r => r.name).join(', ') || '–'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {relativeTime(msg.sentAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography
                            variant="caption"
                            color={isUnread ? 'text.primary' : 'text.secondary'}
                            fontWeight={isUnread ? 600 : 400}
                            noWrap
                            sx={{ display: 'block' }}
                          >
                            {msg.subject}
                          </Typography>
                          {msg.snippet && (
                            <Typography
                              variant="caption" color="text.disabled" noWrap
                              sx={{ display: 'block', mt: 0.1 }}
                            >
                              {msg.snippet}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                  {idx < threads.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

