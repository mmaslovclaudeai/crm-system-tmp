// src/components/ui/ParticipantCell.jsx
import { getIconEmoji, getTypeColor, getTypeName } from '../../utils/financeUtils';

export const ParticipantCell = ({ participant, showIcon = true }) => {
  if (!participant) {
    return (
      <span className="text-gray-400 italic">Не указан</span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {showIcon && (
        <span className="text-lg" title={participant.type}>
          {getIconEmoji(participant.icon)}
        </span>
      )}
      <div>
        <div className="font-medium text-gray-900 truncate">
          {participant.name}
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${getTypeColor(participant.type)}`}>
          {getTypeName(participant.type)}
        </div>
      </div>
    </div>
  );
};