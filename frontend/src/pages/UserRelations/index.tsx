import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Tab, Tabs } from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { AdminPageLayout } from '../../components/AdminPageLayout';
import UsersTab            from './UsersTab';
import RequestsTab         from './RequestsTab';
import { RequestCounts }   from './types';

const UserRelations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get('tab') === 'requests' ? 1 : 0
  );
  const [requestCounts, setRequestCounts] = useState<RequestCounts>({ pending: 0, approved: 0, rejected: 0 });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchParams(newValue === 1 ? { tab: 'requests' } : {}, { replace: true });
  };

  const tabs = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tab label="Benutzer & Zuordnungen" />
      <Tab
        label={
          <Badge
            badgeContent={requestCounts.pending}
            color="error"
            sx={{ pr: requestCounts.pending > 0 ? 1.5 : 0 }}
          >
            Registrierungsanfragen
          </Badge>
        }
      />
    </Tabs>
  );

  return (
    <AdminPageLayout
      icon={<ManageAccountsIcon />}
      title="Benutzer-Zuordnungen"
      loading={false}
      maxWidth={1300}
      filterControls={tabs}
    >
      {activeTab === 0 && <UsersTab />}
      {activeTab === 1 && <RequestsTab onCountsChange={setRequestCounts} />}
    </AdminPageLayout>
  );
};

export default UserRelations;
