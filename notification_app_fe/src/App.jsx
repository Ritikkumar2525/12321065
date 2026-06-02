import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import InboxIcon from "@mui/icons-material/Inbox";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import RefreshIcon from "@mui/icons-material/Refresh";
import { NotificationList } from "./components/NotificationList.jsx";
import { fetchNotifications } from "./services/notifications.js";
import { Log } from "./services/logger.js";
import { getTopPriorityNotifications } from "./utils/priority.js";
import { loadViewedIds, saveViewedIds } from "./utils/viewedStore.js";

const notificationTypes = [
  "All",
  "Event",
  "Result",
  "Placement"
];

const limitOptions = [5, 10];

const getViewFromHash = () =>
  window.location.hash.replace("#", "") === "priority" ? "priority" : "inbox";

const App = () => {
  const isCompact = useMediaQuery((theme) =>
    theme.breakpoints.down("md")
  );
  const [view, setView] = useState(getViewFromHash);
  const [filters, setFilters] = useState({
    limit: 10,
    page: 1,
    notificationType: "All"
  });
  const [priorityLimit, setPriorityLimit] = useState(10);
  const [notifications, setNotifications] = useState([]);
  const [viewedIds, setViewedIds] = useState(loadViewedIds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const unreadCount = notifications.filter(
    (notification) => !viewedIds.has(notification.id)
  ).length;
  const viewedCount = notifications.length - unreadCount;
  const priorityNotifications = useMemo(
    () => getTopPriorityNotifications(notifications, viewedIds, priorityLimit),
    [notifications, priorityLimit, viewedIds]
  );

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchNotifications(filters);
      setNotifications(response.notifications);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load notifications";
      setError(message);
      await Log("error", "page", message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Log("info", "page", "Notification app mounted");
  }, []);

  useEffect(() => {
    const syncViewFromHash = () => setView(getViewFromHash());

    window.addEventListener("hashchange", syncViewFromHash);

    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [filters.limit, filters.notificationType, filters.page]);

  useEffect(() => {
    saveViewedIds(viewedIds);
  }, [viewedIds]);

  const handleViewChange = (_event, nextView) => {
    setView(nextView);
    if (window.location.hash !== `#${nextView}`) {
      window.location.hash = nextView;
    }
    void Log("info", "state", `Switched view to ${nextView}`);
  };

  const handleTypeChange = (event) => {
    const notificationType = event.target.value;
    setFilters((current) => ({ ...current, notificationType, page: 1 }));
    void Log("info", "state", `Changed notification type to ${notificationType}`);
  };

  const handleLimitChange = (event) => {
    const limit = Number(event.target.value);
    setFilters((current) => ({ ...current, limit, page: 1 }));
    void Log("info", "state", `Changed page limit to ${limit}`);
  };

  const handleViewedChange = (id, nextViewed) => {
    setViewedIds((current) => {
      const next = new Set(current);

      if (nextViewed) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
    void Log(
      "info",
      "state",
      `${nextViewed ? "Marked viewed" : "Marked new"} notification ${id}`
    );
  };

  const handlePageChange = (direction) => {
    setFilters((current) => ({
      ...current,
      page:
        direction === "previous"
          ? Math.max(1, current.page - 1)
          : current.page + 1
    }));
    void Log("info", "state", `Moved to ${direction} page`);
  };

  const handlePriorityLimitChange = (_event, nextValue) => {
    const nextLimit = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    setPriorityLimit(nextLimit);
    void Log("debug", "state", `Priority limit changed to ${nextLimit}`);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        color="default"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 72 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center"
            }}
          >
            <InboxIcon />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: "1.2rem", md: "1.7rem" } }}>
              Campus Notifications
            </Typography>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              Roll No. 12321065
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <span>
              <IconButton
                aria-label="Refresh notifications"
                color="primary"
                disabled={isLoading}
                onClick={() => void loadNotifications()}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={isCompact ? "column" : "row"}
            spacing={1.5}
            sx={{ alignItems: isCompact ? "stretch" : "center" }}
          >
            <Tabs
              onChange={handleViewChange}
              value={view}
              variant={isCompact ? "fullWidth" : "standard"}
              sx={{
                minHeight: 44,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 0.5
              }}
            >
              <Tab icon={<InboxIcon />} iconPosition="start" label="Inbox" value="inbox" />
              <Tab
                icon={<PriorityHighIcon />}
                iconPosition="start"
                label="Priority"
                value="priority"
              />
            </Tabs>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ flex: 1, justifyContent: "flex-end" }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select
                  label="Type"
                  labelId="type-filter-label"
                  onChange={handleTypeChange}
                  value={filters.notificationType}
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="limit-filter-label">Limit</InputLabel>
                <Select
                  label="Limit"
                  labelId="limit-filter-label"
                  onChange={handleLimitChange}
                  value={String(filters.limit)}
                >
                  {limitOptions.map((limit) => (
                    <MenuItem key={limit} value={limit}>
                      {limit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography color="text.secondary" fontWeight={700}>
                  Loaded
                </Typography>
                <Typography variant="h2">{notifications.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography color="text.secondary" fontWeight={700}>
                  New
                </Typography>
                <Typography variant="h2">{unreadCount}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography color="text.secondary" fontWeight={700}>
                  Viewed
                </Typography>
                <Typography variant="h2">{viewedCount}</Typography>
              </CardContent>
            </Card>
          </Stack>

          <Stack
            direction={isCompact ? "column" : "row"}
            spacing={1.5}
            sx={{
              alignItems: isCompact ? "stretch" : "center",
              justifyContent: "space-between"
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterAltIcon color="primary" />
              <Typography variant="h2">
                {view === "priority" ? "Priority Notifications" : "All Notifications"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Previous page">
                <span>
                  <IconButton
                    aria-label="Previous page"
                    disabled={filters.page === 1 || isLoading}
                    onClick={() => handlePageChange("previous")}
                  >
                    <KeyboardArrowLeftIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography fontWeight={800}>Page {filters.page}</Typography>
              <Tooltip title="Next page">
                <span>
                  <IconButton
                    aria-label="Next page"
                    disabled={isLoading || notifications.length < filters.limit}
                    onClick={() => handlePageChange("next")}
                  >
                    <KeyboardArrowRightIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {view === "priority" && (
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ alignItems: { xs: "stretch", sm: "center" } }}
                >
                  <Typography fontWeight={800} sx={{ minWidth: 150 }}>
                    Top {priorityLimit}
                  </Typography>
                  <Slider
                    aria-label="Priority notification count"
                    marks
                    max={10}
                    min={1}
                    onChange={handlePriorityLimitChange}
                    step={1}
                    value={priorityLimit}
                    valueLabelDisplay="auto"
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: 260,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper"
              }}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <NotificationList
              emptyLabel={
                view === "priority"
                  ? "No new priority notifications"
                  : "No notifications found"
              }
              notifications={view === "priority" ? priorityNotifications : notifications}
              onViewedChange={handleViewedChange}
              showPriority={view === "priority"}
              viewedIds={viewedIds}
            />
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ justifyContent: "space-between", pb: 2 }}
          >
            <Button
              disabled={filters.page === 1 || isLoading}
              onClick={() => handlePageChange("previous")}
              startIcon={<KeyboardArrowLeftIcon />}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              disabled={isLoading || notifications.length < filters.limit}
              endIcon={<KeyboardArrowRightIcon />}
              onClick={() => handlePageChange("next")}
              variant="contained"
            >
              Next
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default App;
