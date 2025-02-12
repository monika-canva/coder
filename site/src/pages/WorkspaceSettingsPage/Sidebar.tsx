import { css } from "@emotion/css";
import {
  useTheme,
  type CSSObject,
  type Interpolation,
  type Theme,
} from "@emotion/react";
import ScheduleIcon from "@mui/icons-material/TimerOutlined";
import type { Workspace } from "api/typesGenerated";
import { Stack } from "components/Stack/Stack";
import {
  type FC,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Link, NavLink } from "react-router-dom";
import { combineClasses } from "utils/combineClasses";
import GeneralIcon from "@mui/icons-material/SettingsOutlined";
import ParameterIcon from "@mui/icons-material/CodeOutlined";
import { Avatar } from "components/Avatar/Avatar";

const SidebarNavItem: FC<
  PropsWithChildren<{ href: string; icon: ReactNode }>
> = ({ children, href, icon }) => {
  const theme = useTheme();

  const linkStyles = css({
    color: "inherit",
    display: "block",
    fontSize: 14,
    textDecoration: "none",
    padding: theme.spacing(1.5, 1.5, 1.5, 2),
    borderRadius: theme.shape.borderRadius / 2,
    transition: "background-color 0.15s ease-in-out",
    marginBottom: 1,
    position: "relative",

    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  });

  const activeLinkStyles = css({
    backgroundColor: theme.palette.action.hover,

    "&:before": {
      content: '""',
      display: "block",
      width: 3,
      height: "100%",
      position: "absolute",
      left: 0,
      top: 0,
      backgroundColor: theme.palette.secondary.dark,
      borderTopLeftRadius: theme.shape.borderRadius,
      borderBottomLeftRadius: theme.shape.borderRadius,
    },
  });

  return (
    <NavLink
      end
      to={href}
      className={({ isActive }) =>
        combineClasses([linkStyles, isActive ? activeLinkStyles : undefined])
      }
    >
      <Stack alignItems="center" spacing={1.5} direction="row">
        {icon}
        {children}
      </Stack>
    </NavLink>
  );
};

const SidebarNavItemIcon: FC<{
  icon: ComponentType<{ className?: string }>;
}> = ({ icon: Icon }) => {
  return (
    <Icon
      css={(theme) => ({
        width: theme.spacing(2),
        height: theme.spacing(2),
      })}
    />
  );
};

export const Sidebar: React.FC<{ username: string; workspace: Workspace }> = ({
  username,
  workspace,
}) => {
  return (
    <nav css={styles.sidebar}>
      <Stack direction="row" alignItems="center" css={styles.workspaceInfo}>
        <Avatar src={workspace.template_icon} variant="square" fitImage />
        <Stack spacing={0} css={styles.workspaceData}>
          <Link css={styles.name} to={`/@${username}/${workspace.name}`}>
            {workspace.name}
          </Link>
          <span css={styles.secondary}>
            {workspace.template_display_name ?? workspace.template_name}
          </span>
        </Stack>
      </Stack>

      <SidebarNavItem href="" icon={<SidebarNavItemIcon icon={GeneralIcon} />}>
        General
      </SidebarNavItem>
      <SidebarNavItem
        href="parameters"
        icon={<SidebarNavItemIcon icon={ParameterIcon} />}
      >
        Parameters
      </SidebarNavItem>
      <SidebarNavItem
        href="schedule"
        icon={<SidebarNavItemIcon icon={ScheduleIcon} />}
      >
        Schedule
      </SidebarNavItem>
    </nav>
  );
};

const styles = {
  sidebar: {
    width: 245,
    flexShrink: 0,
  },
  workspaceInfo: (theme) => ({
    ...(theme.typography.body2 as CSSObject),
    marginBottom: theme.spacing(2),
  }),
  workspaceData: {
    overflow: "hidden",
  },
  name: (theme) => ({
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: theme.palette.text.primary,
    textDecoration: "none",
  }),
  secondary: (theme) => ({
    color: theme.palette.text.secondary,
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
} satisfies Record<string, Interpolation<Theme>>;
