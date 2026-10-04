// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    
    enum Status { Valid, Expired, Revoked }

    struct Certificate {
        string recipientName;
        string courseName;
        uint256 issueDate;
        uint256 expirationDate;
        Status status;
        address issuedBy;
        string pdfHash;
    }

    mapping(string => Certificate) public certificates;
    address public admin;

    event CertificateIssued(string certificateId, string recipientName, uint256 issueDate);
    event CertificateRevoked(string certificateId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function issueCertificate(
        string memory _certId,
        string memory _recipientName,
        string memory _courseName,
        uint256 _expirationDate,
        string memory _pdfHash
    ) public onlyAdmin {
        require(certificates[_certId].issueDate == 0, "Certificate ID already exists");
        
        certificates[_certId] = Certificate({
            recipientName: _recipientName,
            courseName: _courseName,
            issueDate: block.timestamp,
            expirationDate: _expirationDate,
            status: Status.Valid,
            issuedBy: msg.sender,
            pdfHash: _pdfHash
        });
        
        emit CertificateIssued(_certId, _recipientName, block.timestamp);
    }

    function revokeCertificate(string memory _certId) public onlyAdmin {
        require(certificates[_certId].issueDate != 0, "Certificate does not exist");
        require(certificates[_certId].status == Status.Valid, "Certificate is already revoked or expired");
        
        certificates[_certId].status = Status.Revoked;
        emit CertificateRevoked(_certId);
    }

    function verifyCertificate(string memory _certId) public view returns (
        string memory recipientName,
        string memory courseName,
        uint256 issueDate,
        uint256 expirationDate,
        Status currentStatus,
        address issuedBy,
        string memory pdfHash
    ) {
        Certificate memory cert = certificates[_certId];
        require(cert.issueDate != 0, "Certificate does not exist");
        
        currentStatus = cert.status;
        if (currentStatus == Status.Valid && block.timestamp > cert.expirationDate) {
            currentStatus = Status.Expired;
        }
        
        return (
            cert.recipientName,
            cert.courseName,
            cert.issueDate,
            cert.expirationDate,
            currentStatus,
            cert.issuedBy,
            cert.pdfHash
        );
    }
}