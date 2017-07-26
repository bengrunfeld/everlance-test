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
    return fetch('./data.txt')
      .then((response) => {
          if (response.status >= 400) {
              throw new Error("Bad response from server");
          }

          
          response.text().then(text => {
            const parsedData = this.parseData(text)
            const parseBursts = this.parseBursts(parsedData)
            const dataWithDelta = this.findDelta(parseBursts)
            const dataWithHighest = this.checkHighestBurst(dataWithDelta)
            const data = this.sortByHighestBurst(dataWithHighest)
            this.setState({data: data}, this.parseData)
          })
      })
  }

  parseData(rawData) {
    if (typeof(rawData) === 'undefined') 
      return false 

    const data = rawData.split(']')

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
    return filteredData
  }

  parseBursts(data) {
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
    return newData
  }

  findDelta(data) {
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
    return newData
  }  

  checkHighestBurst(data) {
  
    const newData = data.map((item, i) => {
      let highest = {
        roi: 0
      }

      item.bursts.forEach((burst, i) => {
        let dStart = new Date('5/1/2004')
        let dEnd = new Date('5/1/2004')

        let ds = new Date(dStart.setMonth(dStart.getMonth() + burst.start))
        let de = new Date(dEnd.setMonth(dEnd.getMonth() + burst.end))

        const roi = burst.delta / burst.prices[0].price

        if (roi > highest.roi) {
          highest.delta = burst.delta
          highest.startDate = `${ds.getMonth()}/${ds.getDate()}/${ds.getFullYear()}`
          highest.endDate = `${de.getMonth()}/${de.getDate()}/${de.getFullYear()}`
          highest.roi = roi.toFixed(3)
        }
      })
      return Object.assign({}, item, {
        highestRoi: highest
      })
    })
    return newData
  }

  sortByHighestBurst(data) {
    const compare = (a,b) => {
      if (a.highestRoi.roi > b.highestRoi.roi)
        return -1
      if (a.highestRoi.roi < b.highestRoi.roi)
        return 1
      return 0
    }

    // Shouldn't mutate original data structure but I was out of time
    data.sort(compare)
    return data
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
