import { css } from "@emotion/css";
import { type Interpolation, type Theme, useTheme } from "@emotion/react";
import Link from "@mui/material/Link";
import { WorkspaceOutdatedTooltip } from "components/WorkspaceOutdatedTooltip/WorkspaceOutdatedTooltip";
import { type FC } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  getDisplayWorkspaceTemplateName,
  isWorkspaceOn,
  workspaceUpdatePolicy,
} from "utils/workspace";
import type { Workspace } from "api/typesGenerated";
import { Stats, StatsItem } from "components/Stats/Stats";
import upperFirst from "lodash/upperFirst";
import { autostartDisplay, autostopDisplay } from "utils/schedule";
import IconButton from "@mui/material/IconButton";
import RemoveIcon from "@mui/icons-material/RemoveOutlined";
import AddIcon from "@mui/icons-material/AddOutlined";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { WorkspaceStatusText } from "components/WorkspaceStatusBadge/WorkspaceStatusBadge";
import { DormantDeletionStat } from "components/WorkspaceDeletion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  usePopover,
} from "components/Popover/Popover";
import { useTemplatePoliciesEnabled } from "components/Dashboard/DashboardProvider";
import {
  HelpTooltip,
  HelpTooltipText,
} from "components/HelpTooltip/HelpTooltip";
import { Stack } from "components/Stack/Stack";

const Language = {
  workspaceDetails: "Workspace Details",
  templateLabel: "Template",
  costLabel: "Daily cost",
  updatePolicy: "Update policy",
};

export interface WorkspaceStatsProps {
  workspace: Workspace;
  maxDeadlineIncrease: number;
  maxDeadlineDecrease: number;
  canUpdateWorkspace: boolean;
  canChangeVersions: boolean;
  quotaBudget?: number;
  onDeadlinePlus: (hours: number) => void;
  onDeadlineMinus: (hours: number) => void;
  handleUpdate: () => void;
}

export const WorkspaceStats: FC<WorkspaceStatsProps> = ({
  workspace,
  quotaBudget,
  maxDeadlineDecrease,
  maxDeadlineIncrease,
  canUpdateWorkspace,
  canChangeVersions,
  handleUpdate,
  onDeadlineMinus,
  onDeadlinePlus,
}) => {
  const theme = useTheme();
  const displayTemplateName = getDisplayWorkspaceTemplateName(workspace);
  const deadlinePlusEnabled = maxDeadlineIncrease >= 1;
  const deadlineMinusEnabled = maxDeadlineDecrease >= 1;
  const templatePoliciesEnabled = useTemplatePoliciesEnabled();

  const paperStyles = css`
    padding: ${theme.spacing(3)};
    max-width: ${theme.spacing(36)};
    margin-top: ${theme.spacing(1)};
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `;

  return (
    <>
      <Stats aria-label={Language.workspaceDetails} css={styles.stats}>
        <StatsItem
          css={styles.statsItem}
          label="Status"
          value={<WorkspaceStatusText workspace={workspace} />}
        />
        <DormantDeletionStat workspace={workspace} />
        <StatsItem
          css={styles.statsItem}
          label={Language.templateLabel}
          value={
            <div css={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Link
                component={RouterLink}
                to={`/templates/${workspace.template_name}`}
              >
                {displayTemplateName}
              </Link>

              {workspace.outdated && (
                <WorkspaceOutdatedTooltip
                  templateName={workspace.template_name}
                  latestVersionId={workspace.template_active_version_id}
                  onUpdateVersion={handleUpdate}
                  ariaLabel="update version"
                />
              )}
            </div>
          }
        />

        {shouldDisplayScheduleLabel(workspace) && (
          <StatsItem
            css={styles.statsItem}
            label={getScheduleLabel(workspace)}
            value={
              <span css={styles.scheduleValue}>
                <Link
                  component={RouterLink}
                  to="settings/schedule"
                  title="Schedule settings"
                >
                  {isWorkspaceOn(workspace)
                    ? autostopDisplay(workspace)
                    : autostartDisplay(workspace.autostart_schedule)}
                </Link>
                {canUpdateWorkspace && canEditDeadline(workspace) && (
                  <span css={styles.scheduleControls}>
                    <Popover>
                      <PopoverTrigger>
                        <IconButton
                          disabled={!deadlineMinusEnabled}
                          size="small"
                          title="Subtract hours from deadline"
                          css={styles.scheduleButton}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </PopoverTrigger>
                      <PopoverContent
                        id="schedule-sub"
                        classes={{ paper: paperStyles }}
                        horizontal="right"
                      >
                        <DecreaseTimeContent
                          maxDeadlineDecrease={maxDeadlineDecrease}
                          onDeadlineMinus={onDeadlineMinus}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger>
                        <IconButton
                          disabled={!deadlinePlusEnabled}
                          size="small"
                          title="Add hours to deadline"
                          css={styles.scheduleButton}
                        >
                          <AddIcon />
                        </IconButton>
                      </PopoverTrigger>
                      <PopoverContent
                        id="schedule-add"
                        classes={{ paper: paperStyles }}
                        horizontal="right"
                      >
                        <AddTimeContent
                          maxDeadlineIncrease={maxDeadlineIncrease}
                          onDeadlinePlus={onDeadlinePlus}
                        />
                      </PopoverContent>
                    </Popover>
                  </span>
                )}
              </span>
            }
          />
        )}
        {workspace.latest_build.daily_cost > 0 && (
          <StatsItem
            css={styles.statsItem}
            label={Language.costLabel}
            value={`${workspace.latest_build.daily_cost} ${
              quotaBudget ? `/ ${quotaBudget}` : ""
            }`}
          />
        )}
        {templatePoliciesEnabled && (
          <Stack direction="row" spacing={0.5}>
            <StatsItem
              css={styles.statsItem}
              label={Language.updatePolicy}
              value={upperFirst(
                workspaceUpdatePolicy(workspace, canChangeVersions),
              )}
            />
            {workspace.automatic_updates === "never" &&
              workspace.template_require_active_version &&
              !canChangeVersions && (
                <HelpTooltip>
                  <HelpTooltipText>
                    Your workspace has not opted in to automatic updates but
                    your template requires updating to the active version.
                  </HelpTooltipText>
                </HelpTooltip>
              )}
          </Stack>
        )}
      </Stats>
    </>
  );
};

const AddTimeContent = (props: {
  maxDeadlineIncrease: number;
  onDeadlinePlus: (value: number) => void;
}) => {
  const popover = usePopover();

  return (
    <>
      <span css={styles.timePopoverTitle}>Add hours to deadline</span>
      <span css={styles.timePopoverDescription}>
        Delay the shutdown of this workspace for a few more hours. This is only
        applied once.
      </span>
      <form
        css={styles.timePopoverForm}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const hours = Number(formData.get("hours"));
          props.onDeadlinePlus(hours);
          popover.setIsOpen(false);
        }}
      >
        <TextField
          name="hours"
          type="number"
          size="small"
          fullWidth
          css={styles.timePopoverField}
          InputProps={{
            className: timePopoverFieldInputStyles,
          }}
          inputProps={{
            min: 0,
            max: props.maxDeadlineIncrease,
            step: 1,
            defaultValue: 1,
          }}
        />

        <Button css={styles.timePopoverButton} type="submit">
          Apply
        </Button>
      </form>
    </>
  );
};

export const DecreaseTimeContent = (props: {
  onDeadlineMinus: (hours: number) => void;
  maxDeadlineDecrease: number;
}) => {
  const popover = usePopover();

  return (
    <>
      <span css={styles.timePopoverTitle}>Subtract hours to deadline</span>
      <span css={styles.timePopoverDescription}>
        Anticipate the shutdown of this workspace for a few more hours. This is
        only applied once.
      </span>
      <form
        css={styles.timePopoverForm}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const hours = Number(formData.get("hours"));
          props.onDeadlineMinus(hours);
          popover.setIsOpen(false);
        }}
      >
        <TextField
          name="hours"
          type="number"
          size="small"
          fullWidth
          css={styles.timePopoverField}
          InputProps={{
            className: timePopoverFieldInputStyles,
          }}
          inputProps={{
            min: 0,
            max: props.maxDeadlineDecrease,
            step: 1,
            defaultValue: 1,
          }}
        />

        <Button css={styles.timePopoverButton} type="submit">
          Apply
        </Button>
      </form>
    </>
  );
};

export const canEditDeadline = (workspace: Workspace): boolean => {
  return isWorkspaceOn(workspace) && Boolean(workspace.latest_build.deadline);
};

export const shouldDisplayScheduleLabel = (workspace: Workspace): boolean => {
  if (canEditDeadline(workspace)) {
    return true;
  }
  if (isWorkspaceOn(workspace)) {
    return false;
  }
  return Boolean(workspace.autostart_schedule);
};

const getScheduleLabel = (workspace: Workspace) => {
  return isWorkspaceOn(workspace) ? "Stops at" : "Starts at";
};

const timePopoverFieldInputStyles = css`
  font-size: 14px;
  padding: 0px;
  border-radius: 4px;
`;

const styles = {
  stats: (theme) => ({
    padding: 0,
    border: 0,
    gap: theme.spacing(6),
    rowGap: theme.spacing(3),
    flex: 1,

    [theme.breakpoints.down("md")]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: theme.spacing(1),
    },
  }),

  statsItem: {
    flexDirection: "column",
    gap: 0,
    padding: 0,

    "& > span:first-of-type": {
      fontSize: 12,
      fontWeight: 500,
    },
  },

  scheduleValue: (theme) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
  }),

  scheduleControls: (theme) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  }),

  scheduleButton: (theme) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    width: 20,
    height: 20,

    "& svg.MuiSvgIcon-root": {
      width: theme.spacing(1.5),
      height: theme.spacing(1.5),
    },
  }),

  timePopoverTitle: {
    fontWeight: 600,
  },

  timePopoverDescription: (theme) => ({
    color: theme.palette.text.secondary,
  }),

  timePopoverForm: (theme) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
  }),

  timePopoverField: {
    margin: 0,
  },

  timePopoverButton: (theme) => ({
    borderRadius: 4,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    flexShrink: 0,
  }),
} satisfies Record<string, Interpolation<Theme>>;
