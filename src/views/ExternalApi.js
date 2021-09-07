import React, { useState, useEffect } from "react";
import { Button, Alert } from "reactstrap";
import Highlight from "../components/Highlight";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { getConfig } from "../config";
import Loading from "../components/Loading";

export const ExternalApiComponent = () => {

  const {
    user,
    userId,
    getAccessTokenSilently,
    loginWithPopup,
    getAccessTokenWithPopup,
  } = useAuth0();
  const { apiOrigin = "https://ec2-18-222-3-115.us-east-2.compute.amazonaws.com:3001", audience } = getConfig();


  const [userMetadata, setUserMetadata] = useState(null);
  const [pizza , setPizza] = useState(null);

  const handleChange =(e)=>{
      setPizza(e.target.value);
    }

  useEffect(() => {
  const getUserMetadata = async () => {
    const domain = process.env.REACT_APP_AUTH0_DOMAIN;

    try {
      const accessToken = await getAccessTokenSilently({
        audience: `https://${domain}/api/v2/`,
      });

      const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;
      console.log({"userDetails" : userDetailsByIdUrl});
      const metadataResponse = await fetch(userDetailsByIdUrl, {
        headers: {authorization: `Bearer ${process.env.REACT_APP_AUTH0_TOKEN}`, 'content-type': 'application/json'},
      });

      const { user_metadata } = await metadataResponse.json();
      console.log({"USER_METADATA" : user_metadata});
      setUserMetadata(user_metadata);
    } catch (e) {
      console.log(e.message);
    }
  };

  getUserMetadata();
}, [getAccessTokenSilently, user.sub]);

  const [state, setState] = useState({
    showResult: false,
    apiMessage: "",
    error: null,
  });

  const handleSubmit=(e)=>{
    callTestApi();
  }

  const handleConsent = async () => {
    try {
      await getAccessTokenWithPopup();
      setState({
        ...state,
        error: null,
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error,
      });
    }

    await callApi();
  };

  const handleLoginAgain = async () => {
    try {
      await loginWithPopup();
      setState({
        ...state,
        error: null,
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error,
      });
    }

    await callApi();
  };

  const callApi = async () => {
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`${apiOrigin}/api/external/${user.sub}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({"wantsPizza" : "1"}),
      });

      const responseData = await response.json();

      setState({
        ...state,
        showResult: true,
        apiMessage: responseData,
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error,
      });
    }
  };


  const callTestApi = async () => {
    const accessToken = await getAccessTokenSilently({
      audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
    });


    const domain = process.env.REACT_APP_AUTH0_DOMAIN;
    var axios = require("axios").default;
    var options = {
      method: 'PATCH',
      url: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users/${user.sub}`,
      headers: {authorization: `Bearer ${process.env.REACT_APP_AUTH0_TOKEN}`, 'content-type': 'application/json'},
      data: {user_metadata: {"pizza_order" : pizza}}
    };



    axios.request(options).then(function (response) {
      console.log(response.data);

    }).catch(function (error) {
      console.error(error);
    });

  };

  const handle = (e, fn) => {
    e.preventDefault();
    fn();
  };

  return (
    <>
      <div className="mb-5">
        {state.error === "consent_required" && (
          <Alert color="warning">
            You need to{" "}
            <a
              href="#/"
              class="alert-link"
              onClick={(e) => handle(e, handleConsent)}
            >
              consent to get access to users api
            </a>
          </Alert>
        )}

        {state.error === "login_required" && (
          <Alert color="warning">
            You need to{" "}
            <a
              href="#/"
              class="alert-link"
              onClick={(e) => handle(e, handleLoginAgain)}
            >
              log in again
            </a>
          </Alert>
        )}

        <h1>Order a Pizza</h1>
        <p className="lead">
          Order a pizza by typing it in the box below.
        </p>

        <p>
          After clicking the `Order Pizza` button, you can refresh the page and confirm the order that was recieved.
        </p>

        <h3>User Metadata</h3>
        {userMetadata ? (
          <pre>{JSON.stringify(userMetadata, null, 2)}</pre>
        ) : (
          <pre>No Pizza Orders (yet!)</pre>
        )}

        {!audience && (
          <Alert color="warning">
            <p>
              You can't call the API at the moment because your application does
              not have any configuration for <code>audience</code>, or it is
              using the default value of <code>YOUR_API_IDENTIFIER</code>. You
              might get this default value if you used the "Download Sample"
              feature of{" "}
              <a href="https://auth0.com/docs/quickstart/spa/react">
                the quickstart guide
              </a>
              , but have not set an API up in your Auth0 Tenant. You can find
              out more information on{" "}
              <a href="https://auth0.com/docs/api">setting up APIs</a> in the
              Auth0 Docs.
            </p>
            <p>
              The audience is the identifier of the API that you want to call
              (see{" "}
              <a href="https://auth0.com/docs/get-started/dashboard/tenant-settings#api-authorization-settings">
                API Authorization Settings
              </a>{" "}
              for more info).
            </p>

            <p>
              In this sample, you can configure the audience in a couple of
              ways:
            </p>
            <ul>
              <li>
                in the <code>src/index.js</code> file
              </li>
              <li>
                by specifying it in the <code>auth_config.json</code> file (see
                the <code>auth_config.json.example</code> file for an example of
                where it should go)
              </li>
            </ul>
            <p>
              Once you have configured the value for <code>audience</code>,
              please restart the app and try to use the "Ping API" button below.
            </p>
          </Alert>
        )}



        <form onSubmit={callTestApi}>
          <label >
          Enter your pizza here:
          </label><br/>
          <input type="text" value={pizza} required onChange={(e)=> {handleChange(e)}} /><br/>

        </form>

        <Button
          color="primary"
          className="mt-5"
          onClick={callTestApi}
          disabled={!audience}
        >
          Order Pizza
        </Button>
      </div>

      <div className="result-block-container">
        {state.showResult && (
          <div className="result-block" data-testid="api-result">
            <h6 className="muted">Result</h6>
            <Highlight>
              <span>{JSON.stringify(state.apiMessage, null, 2)}</span>
            </Highlight>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuthenticationRequired(ExternalApiComponent, {
  onRedirecting: () => <Loading />,
});
