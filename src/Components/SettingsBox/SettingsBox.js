import {
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Typography
} from "@material-ui/core";
import React, { Component } from "react";

import styles from "./SettingsBox.module.css";

class SettingsBox extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const {
      tiled,
      switchTiled,
      multilevel,
      switchMultilevel,
      tree,
      switchTree,
      disabled,
    } = this.props;
    return (
      <Card className={styles.topleft}>
        <CardContent>
          <Typography variant="h6">Settings</Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={tiled}
                  value="tiled"
                  onChange={switchTiled}
                  color="primary"
                  disabled={disabled}
                />
              }
              label="Use Tiled Planner"
            />
            {tiled ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={multilevel}
                    onChange={switchMultilevel}
                    value="multilevel"
                    color="primary"
                    disabled={disabled}
                  />
                }
                label="Multilevel tiles"
              />
            ) : null}
            {tiled ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tree}
                    onChange={switchTree}
                    value="tree"
                    color="primary"
                    disabled={disabled}
                  />
                }
                label="Dynamic discovery"
              />
            ) : null}
          </FormGroup>
        </CardContent>
      </Card>
    );
  }
}

export default SettingsBox;
