import Lottie from "lottie-react"
import loadingAnimation from "./loading.json"
interface LoaderParams{
  size?:number
  loadingText?:string
  containerStyle?:Record<string,any>
}
export default function LoadingSpinner({ 
  size = 150, 
  loadingText = 'some',
  containerStyle
}:LoaderParams) {
  return (
    <div className="flex flex-col justify-center items-center rounded-xl"
      style={{...containerStyle}}
    >
      <div className="overflow-hidden items-center justify-center relative"
        style={{width:size , height:size / 1.5}}
      >
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          style={{ width: size, height: size, position:"absolute", top: -(size / 10) }}
        />
      </div>
      <span className="font-[500] text-gray-500">{loadingText}</span>
    </div>
  )
}
