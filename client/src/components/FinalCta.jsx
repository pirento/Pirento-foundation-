// Closing call to action used at the bottom of several pages ("Plant one. Feed one. Teach one.").
import { Button, Label, Lines } from './ui.jsx';

export default function FinalCta() {
  return (
    <section className="inverse border-b border-inverse-rule bg-inverse py-28 text-on-inverse md:py-40">
      <div className="container-x">
        <Label n="—">Get involved</Label>
        <Lines
          lines={['Plant one.', 'Feed one.', <span className="text-accent">Teach one.</span>]}
          className="poster h-cta mt-8"
        />
        <div data-reveal className="mt-12 flex flex-wrap gap-3">
          <Button to="/donate" variant="inverse" cursor="Donate">
            Donate now
          </Button>
          <Button
            to="/contact"
            variant="outline"
            className="!border-inverse-rule !text-on-inverse [--wipe:var(--on-inverse)] hover:!text-inverse"
          >
            Partner with us
          </Button>
        </div>
      </div>
    </section>
  );
}
