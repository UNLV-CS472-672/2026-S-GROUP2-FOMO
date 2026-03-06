import { Text } from 'react-native';

type ProfileDescriptionProps = {
  description: string;
};

export default function ProfileDescription({ description }: ProfileDescriptionProps) {
  return <Text className="text-sm leading-[18px] text-black">{description}</Text>;
}
