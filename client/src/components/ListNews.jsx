import React, {Component} from 'react';
import {Card, Modal, FormControl, ListGroup} from 'react-bootstrap';
import Button from 'react-bootstrap-button-loader';
import StackGrid from 'react-stack-grid';
import sizeMe from 'react-sizeme';
import {FaArrowUp, FaArrowDown, FaExternalLinkAlt, FaListAlt} from 'react-icons/fa';
import * as SqlString from "sqlstring";


class ListNews extends Component {
  constructor(props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.state = {
      show: false,
      facts: [],
      newsId: '',
      factText: '',
      inProgress: false,
      loadingFacts: false
    };
  }

  truncate(s, max) {
    if (s.length > max) {
      s = s.slice(0, max) + "...";
    }
    return s;
  }

  handleClose() {
    this.setState({show: false, newsId: '', factText: '', facts: []});
  }

  async handleShow(event, newsId) {
    this.setState({show: true, newsId: newsId});
    await this.fetchNewsFacts(newsId);
  }

  async fetchNewsFacts(newsId) {
    this.setState({loadingFacts: true});
    await this.props.session.request("Select * from news_facts where news_id = " + newsId)
      .then((r) => r.result())
      .then((res) => {
        let result = res.asString();
        result = result.split("\n");
        result.splice(0, 1);
        let facts = [];
        for (let i = 0; i < result.length; i++) {
          let f = result[i].split(",");
          if (f.length === 1) {
            break
          }
          facts.push({
            id: f[0].trim(), upVotes: f[3].trim(), downVotes: f[4].trim(), text: f[5].trim()
          })
        }
        facts.reverse();
        this.setState({facts: facts});
      })
      .catch(() => {
      });
    this.setState({loadingFacts: false});
  }

  async submitNewsFact(event) {
    let id = Math.round(new Date().getTime() / 1000) + Math.floor(Math.random() * 90000000) + 10000;
    this.setState({
      inProgress: true
    });
    let success = false;
    let query = "Insert into news_facts (id, news_id, user, upVotes, downVotes, text) Values(" + id + ", "
      + this.state.newsId + ", '" + this.props.account + "', 0, 0, "
      + SqlString.escape(this.state.factText.replace(/,/g, "，")) + ")";
    await this.props.session.request(query)
      .then((r) => r.result())
      .then((res) => {
        success = true;
      })
      .catch(() => {

      });
    if(success === true) {
      await this.fetchNewsFacts(this.state.newsId);
    }
    this.setState({
      factText: '',
      inProgress: false
    });
  }

  updateNewsFact(value) {
    this.setState({
      factText: value
    });
  }

  async upVoteNewsFact(e, factId, upVotes) {
    this.setState({loadingFacts: true});
    upVotes = parseInt(upVotes) + 1;
    let query = "Update news_facts SET upVotes = " + upVotes + " where id = " + factId;
    await this.props.session.request(query)
      .then((r) => r.result())
      .then((res) => {
      })
      .catch(() => {
      });
    await this.fetchNewsFacts(this.state.newsId);
  }

  async downVoteNewsFact(e, factId, downVotes) {
    this.setState({loadingFacts: true});
    downVotes = parseInt(downVotes) + 1;
    let query = "Update news_facts SET downVotes = " + downVotes + " where id = " + factId;
    await this.props.session.request(query)
      .then((r) => r.result())
      .then((res) => {
      })
      .catch(() => {
      });
    await this.fetchNewsFacts(this.state.newsId);
  }

  render() {
    const {isLoading, size, news, upVoteNews, downVoteNews} = this.props;
    const {width} = size;
    const {show, facts, factText, loadingFacts} = this.state;
    return (
      <div className="col-md-12 news">
        <br/>
        <p className="h3" style={{textTransform: 'capitalize'}}>News</p>
        <br/>
        {isLoading && <span>Fetching News...<br/><br/></span>}
        <StackGrid columnWidth={width <= 768 ? '100%' : '33.33%'} gutterWidth={10} gutterHeight={10} duration={0}>
          {news.map((n) => (

              <Card key={n.id + width}>
                <Card.Body>
                  <Card.Title style={{textTransform: 'capitalize'}}>{this.truncate(n.title.replace(/，/g, ","), 100)}</Card.Title>
                  <Card.Text>
                    {this.truncate(n.description.replace(/，/g, ","), 200)}
                  </Card.Text>
                  <div style={{float: 'right'}}>
                    <FaArrowUp onClick={e => upVoteNews(e, n.id, n.upVotes)} style={{cursor: 'pointer'}}/>{n.upVotes}
                    <br/>
                    <FaArrowDown onClick={e => downVoteNews(e, n.id, n.downVotes)}
                                 style={{cursor: 'pointer'}}/>{n.downVotes}
                  </div>
                  <a href={n.url.replace(/，/g, ",")} target="_blank"><FaExternalLinkAlt/></a>
                  <br/>
                  <FaListAlt onClick={e => this.handleShow(e, n.id)} style={{cursor: 'pointer'}}/>
                </Card.Body>
              </Card>
            )
          )}
        </StackGrid>
        {!isLoading && !news.length && <span>Add a news to get started</span>}
        <br/>
        <Modal show={show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Facts</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{maxHeight: 'calc(100vh - 210px)', overflowY: 'auto'}}>
            <FormControl as="textarea" aria-label="With textarea" value={factText}
                         onChange={e => this.updateNewsFact(e.target.value)}/>
            <br/>
            <Button variant="secondary" onClick={e => this.submitNewsFact(e)} loading={this.state.inProgress}>
              Add Fact
            </Button>
            <br/>
            <br/>
            {loadingFacts && <span>Fetching Facts...<br/><br/></span>}
            <ListGroup>
              {facts.map((fact) => (
                  <ListGroup.Item key={fact.id}>
                    {fact.text.replace(/，/g, ",")}
                    <br/>
                    <div>
                      <FaArrowUp onClick={e => this.upVoteNewsFact(e, fact.id, fact.upVotes)}
                                 style={{cursor: 'pointer'}}/>{fact.upVotes}
                      <br/>
                      <FaArrowDown onClick={e => this.downVoteNewsFact(e, fact.id, fact.downVotes)}
                                   style={{cursor: 'pointer'}}/>{fact.downVotes}
                    </div>
                  </ListGroup.Item>
                )
              )}
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

}

export default sizeMe({monitorHeight: true})(ListNews);
