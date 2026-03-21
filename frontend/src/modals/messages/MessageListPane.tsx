import React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ClearIcon from '@mui/icons-material/Clear';
import GroupIcon from '@mui/icons-material/Group';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Message, MessageGroup, Folder } from './types';
import { relativeTime, senderInitials, avatarColor } from './helpers';

interface Props {
  messages:       Message[];
  groups:         MessageGroup[];
  search:         string;
  onSearch:       (s: string) => void;
  folder:         Folder;
  selectedId?:    string;
  isMobile:       boolean;
  loading:        boolean;
  onMessageClick: (msg: Message) => void;
}

export const MessageListPane: React.FC<Props> = ({
  messages, groups, search, onSearch,
  folder, selectedId, isMobile, loading, onMessageClick,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Search */}
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

      {/* Group chips */}
      {groups.length > 0 && (
        <Box sx={{ px: 1.5, pb: 0.5, display: 'flex', gap: 0.75, flexWrap: 'wrap', flexShrink: 0 }}>
          {groups.map(g => (
            <Chip
              key={g.id} icon={<GroupIcon />} label={g.name}
              size="small" variant="outlined"
              onClick={() => onSearch(g.name)}
              sx={{ cursor: 'pointer', fontSize: '0.72rem' }}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ flexShrink: 0 }} />

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
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
            {messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <ListItemButton
                  selected={msg.id === selectedId && !isMobile}
                  onClick={() => onMessageClick(msg)}
                  sx={{
                    px: 1.5, py: 1.25,
                    bgcolor: !msg.isRead && folder === 0
                      ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04)
                      : undefined,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.10),
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Badge
                      color="primary" variant="dot"
                      invisible={msg.isRead || folder !== 0}
                      overlap="circular"
                      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: avatarColor(msg.sender) }}>
                        {senderInitials(msg.sender)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                          variant="body2" noWrap sx={{ flex: 1 }}
                          fontWeight={!msg.isRead && folder === 0 ? 700 : 400}
                        >
                          {msg.subject}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {relativeTime(msg.sentAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {folder === 0
                          ? `Von: ${msg.sender}`
                          : `An: ${msg.recipients?.map(r => r.name).join(', ') || '–'}`}
                      </Typography>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
                {idx < messages.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
