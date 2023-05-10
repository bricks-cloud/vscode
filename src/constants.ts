export const PORT = 32044;

export const MESSAGE = {
  welcome: 'To start using Bricks, click "Activate Bricks" in the status bar.',
  activated: "Activated! Go to Figma to select a component.",
  noWorkspaceOpened:
    "Open a workspace to start using Bricks Design to Code Tool",
  bricksIsActiveInAnotherWorkspace: (workspace: string) =>
    `Bricks is already active in workspace "${workspace}", or you have something running on port ${PORT}. Please shut it down first.`,
};
