/**
 * INTELLICViews React Migration
 *
 * Migrates iOS INTELLICViews functionality to React/Web:
 * - Common UI components for consistent design
 * - Instruction tiles
 * - Event action buttons
 * - Today list components
 * - Healthcare-specific UI patterns
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Alert,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Info,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ChevronRight,
  Circle,
} from '@mui/icons-material';
import { ReactNode } from 'react';

// ===== Instruction Tile =====

interface InstructionTileProps {
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function InstructionTile({
  title,
  description,
  icon,
  variant = 'info',
  action,
}: InstructionTileProps): JSX.Element {
  const getIcon = (): ReactNode => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <Info />;
    }
  };

  const getColor = (): 'info' | 'success' | 'warning' | 'error' => {
    return variant;
  };

  return (
    <Alert
      severity={getColor()}
      icon={getIcon()}
      action={
        action ? (
          <Button color="inherit" size="small" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2">{description}</Typography>
    </Alert>
  );
}

// ===== Event Action Button =====

interface EventActionButtonProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string | number;
  onPress: () => void;
  disabled?: boolean;
}

export function EventActionButton({
  title,
  description,
  icon,
  badge,
  onPress,
  disabled = false,
}: EventActionButtonProps): JSX.Element {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={disabled ? undefined : onPress}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {icon && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{title}</Typography>
                {badge !== undefined && <Chip label={badge} size="small" color="primary" />}
              </Box>
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
          <ChevronRight />
        </Box>
      </CardContent>
    </Card>
  );
}

// ===== Today List =====

interface TodayListItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  completed?: boolean;
  urgent?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
}

interface TodayListProps {
  items: TodayListItem[];
  emptyMessage?: string;
  title?: string;
}

export function TodayList({
  items,
  emptyMessage = 'No items for today',
  title = 'Today',
}: TodayListProps): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <Box key={item.id}>
                {index > 0 && <Divider />}
                <ListItemButton onClick={item.onPress} disabled={item.completed}>
                  <ListItemIcon>
                    {item.completed ? (
                      <CheckCircle color="success" />
                    ) : item.urgent ? (
                      <Warning color="warning" />
                    ) : item.icon ? (
                      item.icon
                    ) : (
                      <Circle sx={{ fontSize: 12, color: 'primary.main' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'text.disabled' : 'text.primary',
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.urgent && !item.completed && (
                          <Chip label="Urgent" size="small" color="warning" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        )}
                        {item.time && (
                          <Typography variant="caption" color="text.secondary">
                            {item.time}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {item.onPress && <ChevronRight />}
                </ListItemButton>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Status Banner =====

interface StatusBannerProps {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export function StatusBanner({
  status,
  title,
  message,
  icon,
  action,
  onClose,
}: StatusBannerProps): JSX.Element {
  return (
    <Alert
      severity={status}
      icon={icon}
      onClose={onClose}
      action={
        action ? (
          <Button color="inherit" size="small" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      <Typography variant="subtitle2" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2">{message}</Typography>
    </Alert>
  );
}

// ===== Info Card =====

interface InfoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

export function InfoCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  onClick,
}: InfoCardProps): JSX.Element {
  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 3,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" color={`${color}.main`} gutterBottom>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: `${color}.main`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ===== Section Header =====

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Button variant="outlined" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}

// ===== Empty State =====

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps): JSX.Element {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.disabled',
            mb: 2,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {message}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}

// ===== Feature Row =====

interface FeatureRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function FeatureRow({
  icon,
  title,
  description,
  badge,
  enabled,
  onToggle,
}: FeatureRowProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'primary.light',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {title}
          </Typography>
          {badge && <Chip label={badge} size="small" color="primary" />}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {onToggle && (
        <Button
          variant={enabled ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onToggle(!enabled)}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </Button>
      )}
    </Box>
  );
}

// Export all components
export default {
  InstructionTile,
  EventActionButton,
  TodayList,
  StatusBanner,
  InfoCard,
  SectionHeader,
  EmptyState,
  FeatureRow,
};
