import type {Meta} from '@storybook/react';
import {Dialog} from '../src/Dialog';
import {ButtonGroup, Content, Footer, Heading, Header, Image} from '../src/Content';
import {Button} from '../src/Button';
import {Checkbox} from '../src/Checkbox';
import {DialogTrigger} from '../src/DialogTrigger';
import {DialogContainer} from '../src/DialogContainer';
import {useState} from 'react';

const meta: Meta<typeof Dialog> = {
  component: Dialog as any,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    // @ts-ignore
    type: {
      control: 'radio',
      options: ['modal', 'fullscreen', 'fullscreenTakeover']
    }
  }
};

export default meta;

export const DialogTriggerExample = (args: any) => (
  <DialogTrigger {...args}>
    <Button variant="primary">Open dialog</Button>
    <ExampleDialog {...args} />
  </DialogTrigger>
);

DialogTriggerExample.args = {
  showHero: true,
  showHeading: true,
  showHeader: true,
  showFooter: true,
  showButtons: true,
  paragraphs: 1,
  title: 'Dialog title'
};

function ExampleDialog(args: any) {
  return (
    <Dialog {...args}>
      {({close}) => (
        <>
          {args.showHero && <Image slot="hero" src="https://i.imgur.com/Z7AzH2c.png" alt="" />}
          {args.showHeading && <Heading slot="title">{args.title}</Heading>}
          {args.showHeader && <Header>Header</Header>}
          <Content>
            {[...Array(args.paragraphs)].map((_, i) => 
              <p key={i} style={{marginTop: i === 0 ? 0 : undefined, marginBottom: i === args.paragraphs - 1 ? 0 : undefined}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in</p>
            )}
          </Content>
          {args.showFooter && <Footer><Checkbox>Don't show this again</Checkbox></Footer>}
          {args.showButtons &&
            <ButtonGroup>
              <Button onPress={close} variant="secondary">Cancel</Button>
              <Button onPress={close} variant="accent">Save</Button>
            </ButtonGroup>
          }
        </>
      )}
    </Dialog>
  );
}

export function DialogContainerExample(props: any) {
  let [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button variant="accent" onPress={() => setOpen(true)}>Open dialog</Button>
      <DialogContainer onDismiss={() => setOpen(false)} {...props}>
        {isOpen &&
          <ExampleDialog {...props} />
        }
      </DialogContainer>
    </>
  );
}

DialogContainerExample.args = DialogTriggerExample.args;