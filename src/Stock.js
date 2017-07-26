import React from 'react'

const Stock = ({name, roi, delta, start, end}) => {
  return(
    <tr className="stock">
      <td>{name}</td>
      <td>{roi}%</td>
      <td>{delta}</td>
      <td>{start}</td>
      <td>{end}</td>
    </tr>
  )
}

export default Stock