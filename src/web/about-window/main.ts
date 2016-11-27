'use strict';

import { shell } from 'electron';
const { openExternal } = shell;
import { asyncFor } from 'then-utils';
import CardComponent from '../components/card';

interface AuthorObject {
  name: string;
  github?: string;
}

interface OSSObject {
  name: string;
  license: string;
  description: string;
  link?: string;
  usedFor: string;
}

const { version } = require('../../package.json');
const authors: AuthorObject[] = require('./resources/authors.json');
const oss: OSSObject[] = require('./resources/oss.json');

const versionHeading = document.getElementById('versionHeading');
const authorsHeading = document.getElementById('authorsHeading');
const authorsCards = document.getElementById('authorsCards');
const ossCards = document.getElementById('ossCards');

versionHeading.innerText = `v${version}`;

if (authors.length > 1) authorsHeading.innerText += 's';
asyncFor(authors, (i, author) => {
  const card = new CardComponent({
    title: author.name,
    body: ''
  });

  const githubElm = document.createElement('span');
  githubElm.innerText = 'Github: ';

  const githubLink = document.createElement('a');
  githubLink.innerText = `@${author.github}`;
  githubLink.className = 'author--githubLink';
  githubLink.href = `https://github.com/${author.github}`;
  githubLink.onclick = (e) => {
    e.preventDefault();
    openExternal(githubLink.href);
    return false;
  };

  githubElm.appendChild(githubLink);

  card.bodyElm.appendChild(githubElm);

  card.appendTo(authorsCards);

  return Promise.resolve();
});

asyncFor(oss, (i, software) => {
  const card = new CardComponent({
    title: software.name,
    body: `${software.description}<br><br>
<span class="oss--usedForHeading">Used For</span><br>${software.usedFor}`,
    footer: ' '
  });

  const licenseHeading = document.createElement('span');
  licenseHeading.className = 'oss--licenseHeading';
  licenseHeading.innerText = software.license;

  const softwareLink = document.createElement('a');
  softwareLink.innerText = software.link;
  softwareLink.className = 'oss--softwareLink';
  softwareLink.href = software.link;
  softwareLink.onclick = (e) => {
    e.preventDefault();
    openExternal(softwareLink.href);
    return false;
  };

  card.header.appendChild(licenseHeading);
  card.footerElm.appendChild(softwareLink);

  card.appendTo(ossCards);

  return Promise.resolve();
});
