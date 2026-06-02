import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MarkunreadMailboxIcon from "@mui/icons-material/MarkunreadMailbox";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { formatDateTime, formatRelativeTime } from "../utils/formatters.js";
import { getNotificationTypeWeight } from "../utils/priority.js";

const typeColor = {
  Event: "info",
  Result: "success",
  Placement: "warning"
};

export const NotificationList = ({
  notifications,
  viewedIds,
  showPriority = false,
  emptyLabel,
  onViewedChange
}) => {
  const isCompact = useMediaQuery((theme) =>
    theme.breakpoints.down("sm")
  );

  if (notifications.length === 0) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{
          minHeight: 220,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper"
        }}
      >
        <NotificationsActiveIcon color="disabled" />
        <Typography color="text.secondary" fontWeight={700}>
          {emptyLabel}
        </Typography>
      </Stack>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden"
      }}
    >
      {notifications.map((notification, index) => {
        const isViewed = viewedIds.has(notification.id);

        return (
          <ListItem
            key={notification.id}
            disablePadding
            secondaryAction={
              <Tooltip title={isViewed ? "Mark as new" : "Mark as viewed"}>
                <IconButton
                  edge="end"
                  color={isViewed ? "default" : "primary"}
                  aria-label={isViewed ? "Mark as new" : "Mark as viewed"}
                  onClick={() => onViewedChange(notification.id, !isViewed)}
                >
                  {isViewed ? (
                    <MarkunreadMailboxIcon />
                  ) : (
                    <CheckCircleOutlineIcon />
                  )}
                </IconButton>
              </Tooltip>
            }
            sx={{
              borderBottom:
                index === notifications.length - 1 ? "none" : "1px solid",
              borderColor: "divider",
              bgcolor: isViewed ? "background.paper" : "primary.light"
            }}
          >
            <ListItemButton
              onClick={() => onViewedChange(notification.id, true)}
              sx={{
                alignItems: "flex-start",
                gap: 1.5,
                py: 1.5,
                pr: 7
              }}
            >
              <Box
                sx={{
                  pt: 0.75,
                  color: isViewed ? "text.disabled" : "primary.main",
                  display: "flex"
                }}
              >
                <FiberManualRecordIcon sx={{ fontSize: 12 }} />
              </Box>
              <ListItemText
                disableTypography
                primary={
                  <Stack
                    alignItems={isCompact ? "flex-start" : "center"}
                    direction={isCompact ? "column" : "row"}
                    spacing={1}
                    sx={{ minWidth: 0 }}
                  >
                    <Typography
                      component="span"
                      fontWeight={isViewed ? 650 : 800}
                      sx={{
                        overflowWrap: "anywhere",
                        color: "text.primary"
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        color={typeColor[notification.type]}
                        label={notification.type}
                        size="small"
                        variant={isViewed ? "outlined" : "filled"}
                      />
                      {showPriority && (
                        <Chip
                          label={`P${getNotificationTypeWeight(notification)}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        color={isViewed ? "default" : "primary"}
                        label={isViewed ? "Viewed" : "New"}
                        size="small"
                        variant={isViewed ? "outlined" : "filled"}
                      />
                    </Stack>
                  </Stack>
                }
                secondary={
                  <Stack
                    direction={isCompact ? "column" : "row"}
                    spacing={isCompact ? 0 : 1}
                    sx={{ mt: 0.75 }}
                  >
                    <Typography component="span" color="text.secondary">
                      {formatDateTime(notification.timestamp)}
                    </Typography>
                    <Typography component="span" color="text.secondary">
                      {formatRelativeTime(notification.timestamp)}
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};
