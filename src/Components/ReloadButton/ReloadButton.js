import React, { Component } from "react";

import { Fab } from "@material-ui/core";
import RotateIcon from "@material-ui/icons/RotateRight";
import styles from "./ReloadButton.module.css";

class ReloadButton extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { reloadRoute, show = true } = this.props;
    return (
      <React.Fragment>
        {show ? (
          <div className={styles.resetButtonContainer}>
            <Fab variant="extended" color="primary" onClick={() => reloadRoute(true)} className={styles.resetButton}>
              <RotateIcon className={styles.buttonIcon} />
              Calculate
            </Fab>
          </div>
        ) : null}
      </React.Fragment>
    );
  }
}

export default ReloadButton;
