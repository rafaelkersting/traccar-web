import { lazy, Suspense } from 'react';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import MainPage from './main/MainPage';
import App from './App';
import Loader from './common/components/Loader';
import { useAsyncTask } from './reactHelper';
import { devicesActions } from './store';
import { generateLoginToken } from './common/components/NativeInterface';
import { useLocalization } from './common/components/LocalizationProvider';
import fetchOrThrow from './common/util/fetchOrThrow';
import RequireAccess from './common/components/RequireAccess';

const CombinedReportPage = lazy(() => import('./reports/CombinedReportPage'));
const PositionsReportPage = lazy(() => import('./reports/PositionsReportPage'));
const ServerPage = lazy(() => import('./settings/ServerPage'));
const UsersPage = lazy(() => import('./settings/UsersPage'));
const DevicePage = lazy(() => import('./settings/DevicePage'));
const UserPage = lazy(() => import('./settings/UserPage'));
const NotificationsPage = lazy(() => import('./settings/NotificationsPage'));
const NotificationPage = lazy(() => import('./settings/NotificationPage'));
const GroupsPage = lazy(() => import('./settings/GroupsPage'));
const GroupPage = lazy(() => import('./settings/GroupPage'));
const PositionPage = lazy(() => import('./other/PositionPage'));
const NetworkPage = lazy(() => import('./other/NetworkPage'));
const EventReportPage = lazy(() => import('./reports/EventReportPage'));
const GeofenceReportPage = lazy(() => import('./reports/GeofenceReportPage'));
const ReplayPage = lazy(() => import('./other/ReplayPage'));
const TripReportPage = lazy(() => import('./reports/TripReportPage'));
const StopReportPage = lazy(() => import('./reports/StopReportPage'));
const SummaryReportPage = lazy(() => import('./reports/SummaryReportPage'));
const ChartReportPage = lazy(() => import('./reports/ChartReportPage'));
const DriversPage = lazy(() => import('./settings/DriversPage'));
const DriverPage = lazy(() => import('./settings/DriverPage'));
const CalendarsPage = lazy(() => import('./settings/CalendarsPage'));
const CalendarPage = lazy(() => import('./settings/CalendarPage'));
const ComputedAttributesPage = lazy(() => import('./settings/ComputedAttributesPage'));
const ComputedAttributePage = lazy(() => import('./settings/ComputedAttributePage'));
const MaintenancesPage = lazy(() => import('./settings/MaintenancesPage'));
const MaintenancePage = lazy(() => import('./settings/MaintenancePage'));
const CommandsPage = lazy(() => import('./settings/CommandsPage'));
const CommandPage = lazy(() => import('./settings/CommandPage'));
const StatisticsPage = lazy(() => import('./reports/StatisticsPage'));
const LoginPage = lazy(() => import('./login/LoginPage'));
const RegisterPage = lazy(() => import('./login/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./login/ResetPasswordPage'));
const GeofencesPage = lazy(() => import('./other/GeofencesPage'));
const GeofencePage = lazy(() => import('./settings/GeofencePage'));
const EventPage = lazy(() => import('./other/EventPage'));
const PreferencesPage = lazy(() => import('./settings/PreferencesPage'));
const AccumulatorsPage = lazy(() => import('./settings/AccumulatorsPage'));
const CommandDevicePage = lazy(() => import('./settings/CommandDevicePage'));
const CommandGroupPage = lazy(() => import('./settings/CommandGroupPage'));
const ChangeServerPage = lazy(() => import('./login/ChangeServerPage'));
const DevicesPage = lazy(() => import('./settings/DevicesPage'));
const ScheduledPage = lazy(() => import('./reports/ScheduledPage'));
const DeviceConnectionsPage = lazy(() => import('./settings/DeviceConnectionsPage'));
const GroupConnectionsPage = lazy(() => import('./settings/GroupConnectionsPage'));
const UserConnectionsPage = lazy(() => import('./settings/UserConnectionsPage'));
const LogsPage = lazy(() => import('./reports/LogsPage'));
const SharePage = lazy(() => import('./settings/SharePage'));
const AnnouncementPage = lazy(() => import('./settings/AnnouncementPage'));
const EmulatorPage = lazy(() => import('./other/EmulatorPage'));
const StreamPage = lazy(() => import('./other/StreamPage'));
const AuditPage = lazy(() => import('./reports/AuditPage'));
const AccessProfilesPage = lazy(() => import('./settings/AccessProfilesPage'));

const Navigation = () => {
  const dispatch = useDispatch();
  const { setLocalLanguage } = useLocalization();

  const [searchParams, setSearchParams] = useSearchParams();

  const hasQueryParams = ['locale', 'token', 'uniqueId', 'openid'].some((key) =>
    searchParams.has(key),
  );

  useAsyncTask(
    async ({ signal }) => {
      if (!hasQueryParams) {
        return;
      }

      const newParams = new URLSearchParams(searchParams);

      if (searchParams.has('locale')) {
        setLocalLanguage(searchParams.get('locale'));
        newParams.delete('locale');
      }

      if (searchParams.has('token')) {
        const token = searchParams.get('token');
        await fetch(`/api/session?token=${encodeURIComponent(token)}`, { signal });
        newParams.delete('token');
      }

      if (searchParams.has('uniqueId')) {
        const response = await fetchOrThrow(
          `/api/devices?uniqueId=${searchParams.get('uniqueId')}`,
          { signal },
        );
        const items = await response.json();
        if (items.length > 0) {
          dispatch(devicesActions.selectId(items[0].id));
        }
        newParams.delete('uniqueId');
      }

      if (searchParams.has('openid')) {
        if (searchParams.get('openid') === 'success') {
          generateLoginToken();
        }
        newParams.delete('openid');
      }

      setSearchParams(newParams, { replace: true });
    },
    [hasQueryParams, searchParams, setSearchParams, dispatch, setLocalLanguage],
  );

  if (hasQueryParams) {
    return <Loader />;
  }
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-server" element={<ChangeServerPage />} />
        <Route path="/" element={<App />}>
          <Route
            index
            element={
              <RequireAccess permission="map.view">
                <MainPage />
              </RequireAccess>
            }
          />

          <Route
            path="position/:id"
            element={
              <RequireAccess permission="map.history">
                <PositionPage />
              </RequireAccess>
            }
          />
          <Route
            path="network/:positionId"
            element={
              <RequireAccess permission="map.history">
                <NetworkPage />
              </RequireAccess>
            }
          />
          <Route
            path="event/:id"
            element={
              <RequireAccess permission="report.view">
                <EventPage />
              </RequireAccess>
            }
          />
          <Route
            path="replay"
            element={
              <RequireAccess permission="map.history">
                <ReplayPage />
              </RequireAccess>
            }
          />
          <Route
            path="geofences"
            element={
              <RequireAccess permission="geofence.view">
                <GeofencesPage />
              </RequireAccess>
            }
          />
          <Route path="emulator" element={<EmulatorPage />} />
          <Route path="stream" element={<StreamPage />} />

          <Route path="settings">
            <Route path=":type/:id/share" element={<SharePage />} />
            <Route
              path="accumulators/:deviceId"
              element={
                <RequireAccess permission="device.edit">
                  <AccumulatorsPage />
                </RequireAccess>
              }
            />
            <Route
              path="announcement"
              element={
                <RequireAccess permission="announcement.view">
                  <AnnouncementPage />
                </RequireAccess>
              }
            />
            <Route
              path="calendars"
              element={
                <RequireAccess permission="calendar.view">
                  <CalendarsPage />
                </RequireAccess>
              }
            />
            <Route
              path="calendar/:id"
              element={
                <RequireAccess permission="calendar.edit">
                  <CalendarPage />
                </RequireAccess>
              }
            />
            <Route
              path="calendar"
              element={
                <RequireAccess permission="calendar.create">
                  <CalendarPage />
                </RequireAccess>
              }
            />
            <Route
              path="commands"
              element={
                <RequireAccess permission="command.view">
                  <CommandsPage />
                </RequireAccess>
              }
            />
            <Route
              path="command/:id"
              element={
                <RequireAccess permission="command.edit">
                  <CommandPage />
                </RequireAccess>
              }
            />
            <Route
              path="command"
              element={
                <RequireAccess permission="command.create">
                  <CommandPage />
                </RequireAccess>
              }
            />
            <Route
              path="attributes"
              element={
                <RequireAccess permission="attribute.view">
                  <ComputedAttributesPage />
                </RequireAccess>
              }
            />
            <Route
              path="attribute/:id"
              element={
                <RequireAccess permission="attribute.edit">
                  <ComputedAttributePage />
                </RequireAccess>
              }
            />
            <Route
              path="attribute"
              element={
                <RequireAccess permission="attribute.create">
                  <ComputedAttributePage />
                </RequireAccess>
              }
            />
            <Route
              path="devices"
              element={
                <RequireAccess permission="device.view">
                  <DevicesPage />
                </RequireAccess>
              }
            />
            <Route
              path="device/:id/connections"
              element={
                <RequireAccess permission="user.link-scope">
                  <DeviceConnectionsPage />
                </RequireAccess>
              }
            />
            <Route
              path="device/:id/command"
              element={
                <RequireAccess permission="command.send">
                  <CommandDevicePage />
                </RequireAccess>
              }
            />
            <Route
              path="device/:id/appearance"
              element={
                <RequireAccess permission="device.appearance.view">
                  <DevicePage appearanceOnly />
                </RequireAccess>
              }
            />
            <Route
              path="device/:id"
              element={
                <RequireAccess permission="device.edit">
                  <DevicePage />
                </RequireAccess>
              }
            />
            <Route
              path="device"
              element={
                <RequireAccess permission="device.create">
                  <DevicePage />
                </RequireAccess>
              }
            />
            <Route
              path="drivers"
              element={
                <RequireAccess permission="driver.view">
                  <DriversPage />
                </RequireAccess>
              }
            />
            <Route
              path="driver/:id"
              element={
                <RequireAccess permission="driver.edit">
                  <DriverPage />
                </RequireAccess>
              }
            />
            <Route
              path="driver"
              element={
                <RequireAccess permission="driver.create">
                  <DriverPage />
                </RequireAccess>
              }
            />
            <Route
              path="geofence/:id"
              element={
                <RequireAccess permission="geofence.edit">
                  <GeofencePage />
                </RequireAccess>
              }
            />
            <Route
              path="geofence"
              element={
                <RequireAccess permission="geofence.create">
                  <GeofencePage />
                </RequireAccess>
              }
            />
            <Route
              path="groups"
              element={
                <RequireAccess permission="group.view">
                  <GroupsPage />
                </RequireAccess>
              }
            />
            <Route
              path="group/:id/connections"
              element={
                <RequireAccess permission="user.link-scope">
                  <GroupConnectionsPage />
                </RequireAccess>
              }
            />
            <Route
              path="group/:id/command"
              element={
                <RequireAccess permission="command.send">
                  <CommandGroupPage />
                </RequireAccess>
              }
            />
            <Route
              path="group/:id"
              element={
                <RequireAccess permission="group.edit">
                  <GroupPage />
                </RequireAccess>
              }
            />
            <Route
              path="group"
              element={
                <RequireAccess permission="group.create">
                  <GroupPage />
                </RequireAccess>
              }
            />
            <Route
              path="maintenances"
              element={
                <RequireAccess permission="maintenance.view">
                  <MaintenancesPage />
                </RequireAccess>
              }
            />
            <Route
              path="maintenance/:id"
              element={
                <RequireAccess permission="maintenance.edit">
                  <MaintenancePage />
                </RequireAccess>
              }
            />
            <Route
              path="maintenance"
              element={
                <RequireAccess permission="maintenance.create">
                  <MaintenancePage />
                </RequireAccess>
              }
            />
            <Route
              path="notifications"
              element={
                <RequireAccess permission="notification.view">
                  <NotificationsPage />
                </RequireAccess>
              }
            />
            <Route
              path="notification/:id"
              element={
                <RequireAccess permission="notification.edit">
                  <NotificationPage />
                </RequireAccess>
              }
            />
            <Route
              path="notification"
              element={
                <RequireAccess permission="notification.create">
                  <NotificationPage />
                </RequireAccess>
              }
            />
            <Route
              path="preferences"
              element={
                <RequireAccess permission="preference.view">
                  <PreferencesPage />
                </RequireAccess>
              }
            />
            <Route
              path="server"
              element={
                <RequireAccess permission="server.view">
                  <ServerPage />
                </RequireAccess>
              }
            />
            <Route
              path="access-profiles"
              element={
                <RequireAccess permission="access-profile.view">
                  <AccessProfilesPage />
                </RequireAccess>
              }
            />
            <Route
              path="users"
              element={
                <RequireAccess permission="user.view">
                  <UsersPage />
                </RequireAccess>
              }
            />
            <Route
              path="user/:id/connections"
              element={
                <RequireAccess permission="user.link-scope">
                  <UserConnectionsPage />
                </RequireAccess>
              }
            />
            <Route
              path="user/:id"
              element={
                <RequireAccess permission={['user.edit', 'preference.view']}>
                  <UserPage />
                </RequireAccess>
              }
            />
            <Route
              path="user"
              element={
                <RequireAccess permission="user.create">
                  <UserPage />
                </RequireAccess>
              }
            />
          </Route>

          <Route path="reports">
            <Route
              path="combined"
              element={
                <RequireAccess permission="report.view">
                  <CombinedReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="chart"
              element={
                <RequireAccess permission="report.view">
                  <ChartReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="events"
              element={
                <RequireAccess permission="report.view">
                  <EventReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="geofences"
              element={
                <RequireAccess permission="report.view">
                  <GeofenceReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="route"
              element={
                <RequireAccess permission="report.view">
                  <PositionsReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="stops"
              element={
                <RequireAccess permission="report.view">
                  <StopReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="summary"
              element={
                <RequireAccess permission="report.view">
                  <SummaryReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="trips"
              element={
                <RequireAccess permission="report.view">
                  <TripReportPage />
                </RequireAccess>
              }
            />
            <Route
              path="scheduled"
              element={
                <RequireAccess permission="report.view">
                  <ScheduledPage />
                </RequireAccess>
              }
            />
            <Route
              path="statistics"
              element={
                <RequireAccess permission="report.view">
                  <StatisticsPage />
                </RequireAccess>
              }
            />
            <Route
              path="audit"
              element={
                <RequireAccess permission="report.view">
                  <AuditPage />
                </RequireAccess>
              }
            />
            <Route
              path="logs"
              element={
                <RequireAccess permission="report.view">
                  <LogsPage />
                </RequireAccess>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default Navigation;
