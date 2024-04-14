/* eslint-disable @next/next/no-img-element */
// import { Round } from "~~/components/rounds-and-votes/IRound";

// interface RoundCardProps {
//   round: Round;
// }

interface RoundCardProps {
  imgSrc: string;
  status: string;
  title: string;
}

function RoundCard(props: RoundCardProps): JSX.Element {
  return (
    <div className={`round-card card image-full rounded-none my-6 ${props.status}`}>
      <figure>
        <img src={props.imgSrc} alt={props.title} className="rounded-none" />
      </figure>
      <div className="card-body p-0 justify-end items-center">
        <h6 className="text-center bg-black px-5 py-1">
          {props.title} - {props.status}
        </h6>
      </div>
    </div>
  );
}

export default RoundCard;
