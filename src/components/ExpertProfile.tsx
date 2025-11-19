// This is a wrapper component that renders only profile sections from ExpertDashboard
import { ExpertDashboard } from './ExpertDashboard';

type ExpertProfileProps = {
  accessToken: string;
  expertId: string;
  onBack: () => void;
};

export function ExpertProfile({ accessToken, expertId, onBack }: ExpertProfileProps) {
  return (
    <ExpertDashboard 
      accessToken={accessToken}
      expertId={expertId}
      onBack={onBack}
      hideHeaderAndNav={true}
      showOnlyServices={false}
    />
  );
}
