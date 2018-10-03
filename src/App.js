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
import Snackbar from '@material-ui/core/Snackbar';

ReactChartkick.addAdapter(Chart);

//7645d1c8-2ccf-40a4-a84c-81788989957d -- client ID
// 6e04c6bc-f996-4dcf-87aa-bf34e3cf3f81 -- client secret



const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
`;

const Marker = styled.div`
  font-size: 20pt; 
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
        publishKey: 'pub-c-0bff8627-f884-4948-a5d8-c00ab71b2594',
        subscribeKey: 'sub-c-d4fb4c70-a0d8-11e8-ab44-96e83d2b591d'
    });

    this.state = {
      model: "",
      make: "",
      year: "",
      id: "",
      odometer: 0,
      location: {
        lat: 37.741490,
        lng: -122.413230
      }
    }
    this.fetchData = this.fetchData.bind(this)
    this.pubnub.init(this);
  }

  componentWillMount() {
    this.pubnub.subscribe({
        channels: ['auth'],
        withPresence: true
    });

    this.pubnub.getMessage(['auth'], (msg) => {
        this.fetchData(msg.message);
    });

    this.pubnub.getStatus((st) => {
        this.pubnub.publish({
            message: 'Req',
            channel: 'auth'
        });
    });
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
        channels: ['auth']
    });
  }

  handleOnClick () {
    const permissions = [
      "control_security",
      "control_security:unlock", 
      "control_security:lock",
      "read_odometer",
      "read_location",
      "read_vehicle_info"
    ];
    window.open(`https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=7645d1c8-2ccf-40a4-a84c-81788989957d&scope=${permissions.join(" ")}&redirect_uri=https://pubsub.pubnub.com/v1/blocks/sub-key/sub-c-d4fb4c70-a0d8-11e8-ab44-96e83d2b591d/smartcar&state=0facda3319&mode=test`, 'toolbar=0,status=0,width=548,height=325');
  }

  fetchData(token){
    const url = "https://api.smartcar.com/v1.0/vehicles/";

    const http_options = {
      "headers": {
          "Authorization" : `Bearer ${token}`
       }
    };

    fetch(url, http_options).then((res) => {
      if(res.ok){
        return res.json();
      }else {
        return Promise.reject(res.status);
      }
      
    }).then(({vehicles}) => {
      const urls = [
        `${url + vehicles[0]}`,
        `${url + vehicles[0]}/location`,
        `${url + vehicles[0]}/odometer`
      ];

      Promise.all(urls.map(url =>
        fetch(url, http_options)
          .then(res => {return res.json()})                 
          .then((value) => {return value})
          .catch(error => {console.log(error)})
      ))
      .then(data => {
        const { id, make, model, year } = data[0];
        const {distance} = data[2];
        this.setState(
          {
            id: id,
            model: model,
            make: make,
            year: year,
            odometer: distance,
            location: data[1]

          }
        );
      });
    }).catch((error)=> {
      console.log("error", error);
    });
  }


  render() {
    const { classes } = this.props;
    const { id, odometer, location, model, make, year} = this.state;
    const mapCenter = {
      lat: 37.741490,
      lng: -122.413230
    }
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
                  defaultCenter={mapCenter}
                  defaultZoom={3}
                > 
                <Marker
                  lat={location.latitude}
                  lng={location.longitude}> 
                  {this.state.make}
                </Marker>
                </GoogleMapReact>
              </div>
              <CardContent>
                <Typography gutterBottom variant="headline" component="h2">
                  {`${year} ${make}  ${model}`}
                </Typography>
                <Typography component="p">
                <strong> ID </strong> {id}
                <strong> Make </strong> {make}
                <strong> Model </strong> {model}
                <strong> Year </strong> {year}
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
                    "2017-09-07": odometer - (odometer - 300),
                    "2017-09-08": odometer - (odometer - 20),
                    "2017-09-09": odometer - (odometer - 50),
                    "2017-09-10": odometer - (odometer - 10),
                    "2017-09-11": odometer - (odometer - 5),
                    "2017-09-12": odometer - (odometer - 10)
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
                    Here you can do things like open the car door, open the trunk or even start your engine. All remotely and in real time.
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardActions>
                <Button size="small" color="primary" onClick={() => {
                  this.pubnub.publish({
                    message: {vehicle: id},
                    channel: 'lock'
                  });
                  alert("doors unlocked");
                }}>
                  unlock Door
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
