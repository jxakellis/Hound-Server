const dogLogLikeColumns = `
  dll.logUUID,
  dll.userId
`;

type DogLogLikeRow = {
    logUUID: string,
    userId: string,
};

type NotYetCreatedDogLogLikeRow = DogLogLikeRow;

export {
  type DogLogLikeRow,
  type NotYetCreatedDogLogLikeRow,
  dogLogLikeColumns,
};
