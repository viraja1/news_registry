import React, {Component} from 'react';

import {Route, BrowserRouter} from 'react-router-dom';
import SideNav, {NavItem, NavIcon, NavText} from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import {FaHome, FaPlusCircle} from 'react-icons/fa';
import {Navbar} from 'react-bootstrap';

import AddNews from './AddNews.jsx';
import ListNews from './ListNews.jsx';
import {web3} from "./web3";
import * as fluence from "fluence";
import * as SqlString from "sqlstring";
import {privateKey, contract, appId, ethereumUrl} from "./config";

export default class Main extends Component {

  constructor(props) {
    super(props);
    this.state = {
      newNews: {
        title: '',
        description: '',
        url: ''
      },
      isLoading: false,
      expanded: false,
      error: '',
      news: [],
      account: null,
      inProgress: false,
      session: null
    };
  }

  updateNews(key, value) {
    const news = this.state.newNews;
    news[key] = value;
    this.setState({
      newNews: news
    })
  }


  async handleNewsSubmit(event, history) {
    let newNews = this.state.newNews;
    let url_regex = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;
    if (typeof newNews.title === "undefined" || newNews.title.trim() === "") {
      this.setState({error: "Valid title is required"});
      return;
    }
    if (typeof newNews.description === "undefined" || newNews.description.trim() === "") {
      this.setState({error: "Valid description is required"});
      return;
    }
    if (typeof newNews.url === "undefined" || newNews.url.trim() === "" || !newNews.url.match(url_regex)) {
      this.setState({error: "Valid url is required"});
      return;
    }
    if(this.state.session === null){
      this.setState({error: "refresh the page and try again"});
      return;
    }
    this.setState({error: '', inProgress: true});
    await this.saveNewNews(newNews);
    this.setState({
      newNews: {
        title: '',
        description: '',
        url: ''
      },
      inProgress: false
    });
    history.push('/home');
    await this.fetchNews();
  }

  async saveNewNews(newNews) {
    let id = Math.round(new Date().getTime() / 1000) + Math.floor(Math.random() * 90000000) + 10000;
    let query = "Insert into news (id, user, upVotes, downVotes, url, title, description) Values(" + id + ", '"
      + this.state.account + "', 0, 0, " + SqlString.escape(newNews.url.replace(/,/g, "，")) + ", "
      + SqlString.escape(newNews.title.replace(/,/g, "，")) + ", "
      + SqlString.escape(newNews.description.replace(/,/g, "，")) + ")";
    await this.state.session.request(query)
      .then((r) => r.result())
      .then((res) => {
      })
      .catch( () => {
      })
  }

  async upVoteNews(e, newsId, upVotes) {
    this.setState({
      isLoading: true
    });
    upVotes = parseInt(upVotes) + 1;
    let query = "Update news SET upVotes = " + upVotes + " where id = " + newsId;
    await this.state.session.request(query)
      .then((r) => r.result())
      .then((res) => {
      })
      .catch(() => {
      });
    await this.fetchNews();
  }

  async downVoteNews(e, newsId, downVotes) {
    this.setState({
      isLoading: true
    });
    downVotes = parseInt(downVotes) + 1;
    let query = "Update news SET downvotes = " + downVotes + " where id = " + newsId;
    await this.state.session.request(query)
      .then((r) => r.result())
      .then((res) => {
      })
      .catch(() => {
      });
    await this.fetchNews();
  }

  onToggle(expanded) {
    this.setState({expanded: expanded});
  }

  render() {
    const {expanded, news, isLoading, error, inProgress, session, account} = this.state;
    return (
      <BrowserRouter>
        <Route render={({location, history}) => (
          <React.Fragment>
            <div className="site-sub-wrapper">
              <SideNav className="side-nav"
                       onSelect={(selected) => {
                         const to = '/' + selected;
                         if (location.pathname !== to) {
                           history.push(to);
                         }
                       }}
                       onToggle={this.onToggle.bind(this)}
              >
                <SideNav.Toggle/>
                <SideNav.Nav selected={location.pathname.replace('/', '')} className="side-nav-sub">
                  <NavItem eventKey="home">
                    <NavIcon>
                      <FaHome/>
                    </NavIcon>
                    <NavText>
                      Home
                    </NavText>
                  </NavItem>
                  <NavItem eventKey="add_news">
                    <NavIcon>
                      <FaPlusCircle/>
                    </NavIcon>
                    <NavText>
                      Add News
                    </NavText>
                  </NavItem>
                </SideNav.Nav>
              </SideNav>
              <Navbar bg="nav" variant="dark" style={{
                marginLeft: expanded ? 240 : 64
              }}>
                <Navbar.Brand style={{marginLeft: '20px'}}>News Registry</Navbar.Brand>
                <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
                  <ul className="navbar-nav">
                    <li className="nav-item">
                      <div>

                      </div>
                    </li>
                  </ul>
                </div>
              </Navbar>
              <main style={{
                marginLeft: expanded ? 240 : 64,
                padding: '10px 20px 0 20px'
              }}>
                <Route path="/home" exact render={props => <ListNews
                  isLoading={isLoading} news={news} upVoteNews={this.upVoteNews.bind(this)}
                  downVoteNews={this.downVoteNews.bind(this)} session={session} account={account}
                />}/>
                <Route path="/" exact render={props => <ListNews
                  isLoading={isLoading} news={news} upVoteNews={this.upVoteNews.bind(this)}
                  downVoteNews={this.downVoteNews.bind(this)} session={session} account={account}
                />}/>
                <Route path="/add_news" render={props => <AddNews
                  updateNews={this.updateNews.bind(this)}
                  handleNewsSubmit={this.handleNewsSubmit.bind(this)}
                  inProgress={inProgress}
                  newNews={this.state.newNews} history={history} error={error}/>}/>
              </main>
            </div>
          </React.Fragment>
        )}
        />
      </BrowserRouter>
    );
  }

  async fetchNews() {
    if(this.state.session === null){
      this.setState({isLoading: false});
      return
    }
    this.setState({isLoading: true});
    await this.state.session.request("Select * from news")
      .then((r) => r.result())
      .then((res) => {
        let result = res.asString();
        result = result.split("\n");
        result.splice(0, 1);
        let news = [];
        for (let i = 0; i < result.length; i++) {
          let n = result[i].split(",");
          if (n.length === 1) {
            break
          }
          news.push({
            id: n[0].trim(), upVotes: n[2].trim(), downVotes: n[3].trim(), url: n[4].trim(), title: n[5].trim(),
            description: n[6].trim()
          })
        }
        news.reverse();
        this.setState({news: news});
      })
      .catch((r)=> {
      });
    this.setState({isLoading: false});

  }

  async componentDidMount() {

    this.setState({isLoading: true});
    await fluence.connect(contract, appId, ethereumUrl, privateKey).then((s) => {
      this.setState({
        session: s
      });
    }).catch(() => {

    });
    await this.fetchNews();
    let account = await web3.eth.getAccounts();
    this.setState({account: account[0]});
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log(prevState, this.state);
  }

}
