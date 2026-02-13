import { Link as ExpoRouterLink } from "expo-router";
import { withUniwind } from "uniwind";

const StyledLink = withUniwind(ExpoRouterLink);
export const Link = Object.assign(StyledLink, ExpoRouterLink);
