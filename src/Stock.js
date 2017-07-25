import React from 'react'

const Stock = ({name, roi, delta, start, end}) => {
  return(
    <div className="stock">
      <span className="fieldTitle"> NAME:</span> {name},  
      <span className="fieldTitle"> ROI:</span> {roi}, 
      <span className="fieldTitle"> BURST SIZE:</span> {delta}, 
      <span className="fieldTitle"> START DATE:</span> {start},
      <span className="fieldTitle"> END DATE:</span> {end}
    </div>
  )
}

export default Stock