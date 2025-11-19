// This is a wrapper component that renders only services sections from ExpertDashboard
import { ExpertDashboard } from './ExpertDashboard';

type ExpertServicesProps = {
  accessToken: string;
  expertId: string;
  onBack: () => void;
};

export function ExpertServices({ accessToken, expertId, onBack }: ExpertServicesProps) {
  return (
    <ExpertDashboard 
      accessToken={accessToken}
      expertId={expertId}
      onBack={onBack}
      hideHeaderAndNav={true}
      showOnlyServices={true}
    />
  );
}
