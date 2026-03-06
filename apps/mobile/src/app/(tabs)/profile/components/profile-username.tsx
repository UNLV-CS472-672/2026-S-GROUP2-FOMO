import { Text } from 'react-native';

type ProfileUsernameProps = {
  username: string;
};

export default function ProfileUsername({ username }: ProfileUsernameProps) {
  return <Text className="mb-1 text-base font-bold text-black">{username}</Text>;
}
