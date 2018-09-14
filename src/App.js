import React, { Component } from "react";
import "./App.css";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import GoogleMapReact from "google-map-react";
import ReactChartkick, { LineChart } from "react-chartkick";
import Chart from "chart.js";
import styled from "styled-components";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import PubNubReact from 'pubnub-react';

ReactChartkick.addAdapter(Chart);

//7645d1c8-2ccf-40a4-a84c-81788989957d -- client ID
// 6e04c6bc-f996-4dcf-87aa-bf34e3cf3f81 -- client secret



const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
`;

const SideMenu = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr;
`;
const Center = styled.div`
`;

const styles = {
  card: {
    maxWidth: "80%",
    margin: "auto"
  },
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
};

class App extends Component {

  constructor(props) {
    super(props);
    this.pubnub = new PubNubReact({
        publishKey: 'pub-c-a5669391-d317-44ec-a5f9-782e7bce9832',
        subscribeKey: 'sub-c-cc81b7b4-b523-11e8-80bd-3226ad0d6938'
    });

    this.state = {
      model: "",
      make: "",
      year: "",
      odometer: 0,
      center: {
        lat: 0,
        lng: 0
      }
    }
    this.pubnub.init(this);
  }

  componentWillMount() {
    this.pubnub.subscribe({
        channels: ['vehicles'],
        withPresence: true
    });

    this.pubnub.getMessage(['vehicles'], (msg) => {
        this.setState({
          odometer: msg.message[1].distance, 
          center:{
            lat: msg.message[2].latitude, 
            lng: msg.message[2].longitude
          }
        });
    });

    this.pubnub.getStatus((st) => {
        this.pubnub.publish({
            message: 'Req',
            channel: 'vehicles'
        });
    });
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
        channels: ['vehicles', 'vehicle']
    });
  }

  handleOnClick () {
    window.open(`https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=7645d1c8-2ccf-40a4-a84c-81788989957d&scope=read_odometer read_location read_vehicle_info&redirect_uri=https://pubsub.pubnub.com/v1/blocks/sub-key/sub-c-cc81b7b4-b523-11e8-80bd-3226ad0d6938/smartcar&state=0facda3319&mode=test`, 'toolbar=0,status=0,width=548,height=325');
  }


  render() {
    const { classes } = this.props;
    const { odometer, center, model, make, year} = this.state;
    console.log(this.state);
    return (
      <div className={classes.root}>
      <AppBar position="static" style={{margin: "0px 0px 20px 0px"}}>
        <Toolbar>
          <Typography variant="title" color="inherit" className={classes.grow}>
            My Vehicle Dashboard
          </Typography>
          <Button color="inherit" onClick={this.handleOnClick}>Connect Vehicle</Button>
        </Toolbar>
      </AppBar>
      <Container>
        <Center>
          <Card className={classes.card}>
              <div style={{height: "70vh", width: "100%" }}>
                <GoogleMapReact
                  bootstrapURLKeys={{
                    key: "AIzaSyC1AhKe8qh8W0jgIvfJdGu8Nr5_aXnvddQ"
                  }}
                  defaultCenter={center}
                  defaultZoom={15}
                > 
                <div
                  lat={center.lat}
                  lng={center.lng}> 
                  Audi
                </div>
                </GoogleMapReact>
              </div>
              <CardContent>
                <Typography gutterBottom variant="headline" component="h2">
                  2018 AUDI A4
                </Typography>
                <Typography component="p">
                <strong> ID </strong> 7f4c7c26-04df-48a5-acfe-4e60d319e75d
                <strong> Make </strong> Audi
                <strong> Model </strong> A4
                <strong> Year </strong> 2018
                </Typography>
              </CardContent>
          </Card>
        </Center>
        <SideMenu>
            <Card styles={{width: "100%", height: "50px", psa:"20px 20px auto auto"}}>
              <CardContent>
              <Typography gutterBottom variant="headline" component="h2">
                    Odometer Reading
                  </Typography>
                <LineChart
                  data={{
                    "2017-09-07": this.state.odometer - 35,
                    "2017-09-08": this.state.odometer - 40,
                    "2017-09-09": this.state.odometer - 30,
                    "2017-09-10": this.state.odometer - 20,
                    "2017-09-11": this.state.odometer - 35,
                    "2017-09-12": this.state.odometer
                  }}
                />
              </CardContent>
            </Card>
            <Card className={classes.card}>
              <CardActionArea>
                <CardContent>
                  <Typography gutterBottom variant="headline" component="h2">
                    Interact with car
                  </Typography>
                  <Typography component="p">
                    Here you can do thingsn like open the car door, open the trunk or even start your engine. All remotely and in real time.
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardActions>
                <Button size="small" color="primary">
                  Open Door
                </Button>
                <Button size="small" color="primary">
                  Open Trunk
                </Button>
              </CardActions>
            </Card>
        </SideMenu>
      </Container>
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
