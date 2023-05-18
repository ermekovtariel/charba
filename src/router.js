import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import { DefaultLauout } from './Layouts';

import { Add, Home, Posts, Reference, SignIn, SignUp, User } from './Pages';

export const useRoutes = (isAuthenticated) => {
  if (isAuthenticated) {
    // if (true) {
    return (
      <Switch>
        <DefaultLauout>
          {/* <Route exact path={'/'} component={Home} /> */}
          <Route exact path={'/analyze'} component={Home} />
          <Route exact path={'/user'} component={User} />
          <Route exact path={'/add'} component={Add} />
          <Route exact path={'/plots'} component={Posts} />
          <Route exact path={'/reference'} component={Reference} />
          <Redirect to={'/analyze'} />
        </DefaultLauout>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path={'/'} component={SignIn} exact />
      <Route path={'/sign-up'} component={SignUp} exact />
      <Redirect to={'/'} />
    </Switch>
  );
};
