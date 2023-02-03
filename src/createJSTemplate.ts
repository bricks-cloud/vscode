const createJSTemplate = (
  componentUri: string,
  componentName: string | undefined
): string => {
  return `
  import ReactDOM from "react-dom";
  import ${componentName} from "${componentUri}";

  ReactDOM.render(<${componentName}/>, document.getElementById("root"));`;
};

export default createJSTemplate;
