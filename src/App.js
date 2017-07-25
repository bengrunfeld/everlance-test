import React, { Component } from 'react'
import 'es6-promise'
import fetch from 'isomorphic-fetch'
import './App.css'
import Stock from './Stock'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: []
    }
  }

  fetchData() {
    fetch('./data.txt')
      .then((response) => {
          if (response.status >= 400) {
              throw new Error("Bad response from server");
          }

          response.text().then(text => this.setState({rawData: text}, this.parseData))
      })
  }

  parseData() {
    const data = this.state.rawData.split(']')

    // Parse text data to usable object. Mark empty/undefined items
    const parsedData = data.map(item => {
      const fields = item.split('|')
      return (typeof(fields[1]) !== 'undefined') ? 
        {
          name: fields[0].trim(), 
          tickerSymbol: fields[1].trim(), 
          prices: fields[2].trim().replace('[', '')
            .split(', ').map(Number)
        } 
        : false
    })

    // Filter out empty fields
    const filteredData = parsedData.filter(item => 
      (item !== false) ? true : false)

    this.setState({data: filteredData}, this.parseBursts)
  }

  parseBursts() {
    const { data } = this.state

    const newData = data.map(item => {
      let bursts = []
      let subBurst = []

      item.prices.forEach((price, i, prices) => {
        if(price > prices[i - 1]) {
          subBurst.push({price: price, month: i})
        } else if(price < prices[i + 1]) {
          subBurst.push({price: price, month: i})
        } else {
          if (subBurst.length > 0) {
            bursts.push(subBurst)
          }
          subBurst = []
        }
      })

      return Object.assign({}, item, {bursts: bursts})
    })

    this.setState({data: newData}, this.findDelta)
  }

  findDelta() {
    const { data } = this.state

    let newData = data.map(item => {
      let bursts = item.bursts.map(burst => {
        const delta = burst[burst.length-1].price - burst[0].price

        return { 
          prices: burst, 
          delta: delta, 
          start: burst[0].month, 
          end: burst[burst.length-1].month
        }
      })
      return Object.assign({}, item, {bursts: bursts})
    })

    this.setState({data: newData}, this.checkHighestBurst)
  }  

  checkHighestBurst() {
    const { data } = this.state
  
    const newData = data.map((item, i) => {
      let highest = {
        delta: 0
      }

      item.bursts.forEach((burst, i) => {
        let dStart = new Date('5/1/2004')
        let dEnd = new Date('5/1/2004')

        let dateStart = new Date(dStart.setMonth(dStart.getMonth() + burst.start))
        let dateEnd = new Date(dEnd.setMonth(dEnd.getMonth() + burst.end))

        if (burst.delta > highest.delta) {
          highest.delta = burst.delta
          highest.startDate = `${dStart.getMonth()}/${dStart.getDate()}/${dStart.getFullYear()}`
          highest.endDate = `${dEnd.getMonth()}/${dEnd.getDate()}/${dEnd.getFullYear()}`
          highest.roi = (burst.delta / burst.prices[0].price).toFixed(3)
        }
      })
      return Object.assign({}, item, {
        highestRoi: highest
      })
    })

    this.setState({data: newData}, this.sortByHighestBurst)
  }

  sortByHighestBurst() {
    const { data } = this.state

    function compare(a,b) {
      if (a.highestRoi.delta > b.highestRoi.delta)
        return -1
      if (a.highestRoi.delta < b.highestRoi.delta)
        return 1
      return 0
    }

    // Shouldn't mutate original data structure but I was out of time
    data.sort(compare)
    this.setState({data: data})
  }

  componentDidMount() {
    this.fetchData()
  }

  render() {
    const { data } = this.state

    return (
      <div className="App">
        <h1>Sort Securities By Burst</h1>
        {
          data.map((item, i) => {
            if (typeof(item.highestRoi) === 'undefined') {
              return false 
            }
            return <Stock key={i} 
                          name={item.tickerSymbol} 
                          roi={item.highestRoi.roi}
                          delta={item.highestRoi.delta}
                          start={item.highestRoi.startDate}
                          end={item.highestRoi.endDate}
                          />
          })
        }
      </div>
    );
  }
}

export default App;
