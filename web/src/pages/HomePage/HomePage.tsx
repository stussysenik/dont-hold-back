import { Metadata } from '@redwoodjs/web'

import P5Canvas from 'src/components/P5Canvas/P5Canvas'

const HomePage = () => {
  return (
    <>
      <Metadata
        title="DON'T HOLD BACK"
        description="A digital ritual"
      />
      <P5Canvas />
    </>
  )
}

export default HomePage
