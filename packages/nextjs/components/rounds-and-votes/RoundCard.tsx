/* eslint-disable @next/next/no-img-element */
import { Round } from "~~/components/rounds-and-votes/IRound";

interface RoundCardProps {
  round: Round;
}

function RoundCard({ round }: RoundCardProps): JSX.Element {
  return (
    <div className={`round-card card image-full rounded-none my-6 ${round.status}`}>
      <figure>
        <img src={round.imgSrc} alt={round.title} className="rounded-none" />
      </figure>
      <div className="card-body p-0 justify-end items-center">
        <h6 className="text-center bg-black px-5 py-1">
          {round.title} - {round.status}
        </h6>
      </div>
    </div>
  );
}

export default RoundCard;
